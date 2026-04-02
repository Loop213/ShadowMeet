import { getSocket } from "./socket";
import { useCallStore } from "../store/useCallStore";

const turnUrlRaw = import.meta.env.VITE_TURN_URL;
const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnPassword = import.meta.env.VITE_TURN_PASSWORD;
const customIceServersRaw = import.meta.env.VITE_ICE_SERVERS_JSON;

const parseIceServers = () => {
  const defaults = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrls = (turnUrlRaw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (turnUrls.length) {
    defaults.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: turnUsername || undefined,
      credential: turnPassword || undefined,
    });
  }

  if (!customIceServersRaw) return defaults;

  try {
    const parsed = JSON.parse(customIceServersRaw);
    if (Array.isArray(parsed) && parsed.length) {
      return [...defaults, ...parsed];
    }
  } catch {
    // Keep defaults when custom config is malformed.
  }

  return defaults;
};

const rtcConfig = {
  iceServers: parseIceServers(),
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

const mediaConstraintsByType = (type) => ({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  },
  video:
    type === "video"
      ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: "user",
        }
      : false,
});

let peerConnection = null;
let remoteMediaStream = null;
let outgoingCallTimeout = null;
let reconnectTimer = null;
let currentToken = null;
let currentRemotePeerId = null;
let pendingRemoteCandidates = [];
let restartInFlight = false;
let restartAttempts = 0;
const maxRestartAttempts = 3;

const setCallNotice = ({ title, message, tone = "amber" }) => {
  useCallStore.getState().setCallNotice({ title, message, tone });
};

const clearOutgoingCallTimeout = () => {
  if (outgoingCallTimeout) {
    window.clearTimeout(outgoingCallTimeout);
    outgoingCallTimeout = null;
  }
};

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const resetPeerTransientState = () => {
  pendingRemoteCandidates = [];
  restartInFlight = false;
  restartAttempts = 0;
  clearReconnectTimer();
};

const flushPendingRemoteCandidates = async () => {
  if (!peerConnection || !peerConnection.remoteDescription) return;

  while (pendingRemoteCandidates.length) {
    const candidate = pendingRemoteCandidates.shift();
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch {
      // Ignore stale candidates from previous descriptions.
    }
  }
};

const applyRemoteDescription = async (description) => {
  if (!peerConnection || !description) return;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  await flushPendingRemoteCandidates();
};

const closePeerConnection = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteMediaStream = null;
  currentToken = null;
  currentRemotePeerId = null;
  resetPeerTransientState();
};

const scheduleIceRestart = (reason) => {
  if (!peerConnection || !currentRemotePeerId || !currentToken || restartInFlight) return;
  if (restartAttempts >= maxRestartAttempts) {
    useCallStore.getState().setCallStatus("failed");
    setCallNotice({
      tone: "rose",
      title: "Connection unstable",
      message: "Network recovery failed. Please try calling again.",
    });
    return;
  }

  restartInFlight = true;
  restartAttempts += 1;
  clearReconnectTimer();

  reconnectTimer = window.setTimeout(async () => {
    try {
      if (!peerConnection || peerConnection.signalingState === "closed") return;
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      getSocket(currentToken)?.emit("call_reconnect_offer", {
        receiverId: currentRemotePeerId,
        offer,
        reason,
        attempt: restartAttempts,
      });
      useCallStore.getState().setCallStatus("reconnecting");
    } catch {
      // Retry is governed by max attempts and state callbacks.
    } finally {
      restartInFlight = false;
    }
  }, 900);
};

const createPeer = (token, remotePeerId) => {
  const socket = getSocket(token);
  const peer = new RTCPeerConnection(rtcConfig);

  currentToken = token;
  currentRemotePeerId = remotePeerId;
  resetPeerTransientState();

  remoteMediaStream = new MediaStream();
  useCallStore.getState().setRemoteStream(remoteMediaStream);

  peer.ontrack = (event) => {
    const addTrack = (track) => {
      const alreadyAdded = remoteMediaStream
        ?.getTracks()
        .some((existingTrack) => existingTrack.id === track.id);
      if (!alreadyAdded) remoteMediaStream?.addTrack(track);
    };

    const attachIncoming = () => {
      const tracks = event.streams?.[0]?.getTracks?.() || [event.track].filter(Boolean);
      tracks.forEach(addTrack);
      useCallStore.getState().setRemoteStream(remoteMediaStream);
      useCallStore.getState().setCallStatus("connected");
      restartAttempts = 0;
    };

    if (event.track && event.track.readyState !== "live") {
      event.track.onunmute = () => attachIncoming();
    } else {
      attachIncoming();
    }
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc_ice_candidate", {
        receiverId: remotePeerId,
        candidate: event.candidate,
      });
    }
  };

  peer.onconnectionstatechange = () => {
    const state = peer.connectionState;

    if (state === "connected") {
      restartAttempts = 0;
      restartInFlight = false;
      useCallStore.getState().setCallStatus("connected");
      return;
    }

    if (state === "connecting") {
      useCallStore.getState().setCallStatus("connecting");
      return;
    }

    if (state === "disconnected") {
      useCallStore.getState().setCallStatus("reconnecting");
      scheduleIceRestart("disconnected");
      return;
    }

    if (state === "failed") {
      useCallStore.getState().setCallStatus("reconnecting");
      scheduleIceRestart("failed");
      return;
    }

    if (state === "closed") {
      useCallStore.getState().setCallStatus("ended");
    }
  };

  peer.oniceconnectionstatechange = () => {
    const state = peer.iceConnectionState;
    if (state === "failed") {
      scheduleIceRestart("ice-failed");
    }
  };

  peerConnection = peer;
  return peer;
};

const readMediaError = (error) => {
  const name = error?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      title: "Camera or microphone blocked",
      message: "Allow camera and microphone permissions to start the call.",
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      title: "No media device found",
      message: "Camera or microphone device is not available.",
    };
  }

  if (name === "NotReadableError") {
    return {
      title: "Media device busy",
      message: "Another app may be using your camera or microphone.",
    };
  }

  return {
    title: "Call setup failed",
    message: "Unable to access media devices. Please retry.",
  };
};

const getMediaStream = async (type) => {
  try {
    return await navigator.mediaDevices.getUserMedia(mediaConstraintsByType(type));
  } catch (error) {
    if (type !== "video") {
      throw error;
    }

    // Fallback for weaker devices/networks.
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 360, max: 720 },
        frameRate: { ideal: 20, max: 24 },
        facingMode: "user",
      },
    });
  }
};

export const startOutgoingCall = async ({ token, receiverId, type }) => {
  const socket = getSocket(token);
  if (!socket) {
    setCallNotice({
      tone: "amber",
      title: "Signaling disconnected",
      message: "Socket connection is not available. Retry in a moment.",
    });
    return;
  }

  if (useCallStore.getState().activeCall) {
    endCall(token);
  }

  try {
    const localStream = await getMediaStream(type);
    const peer = createPeer(token, receiverId);

    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("call_user", { receiverId, type, offer });
    useCallStore.getState().startCallSession({
      receiverId,
      type,
      status: "calling",
      direction: "outgoing",
    });
    useCallStore.getState().setStreams({ localStream, remoteStream: remoteMediaStream });

    clearOutgoingCallTimeout();
    outgoingCallTimeout = window.setTimeout(() => {
      const activeCall = useCallStore.getState().activeCall;
      if (activeCall?.status === "calling" && activeCall?.receiverId === receiverId) {
        endCall(token);
        setCallNotice({
          tone: "amber",
          title: "Call timed out",
          message: "The other user did not answer in time.",
        });
      }
    }, 35000);
  } catch (error) {
    const details = readMediaError(error);
    setCallNotice({ tone: "rose", ...details });
    closePeerConnection();
    throw error;
  }
};

export const acceptIncomingCall = async ({ token, incomingCall }) => {
  const socket = getSocket(token);
  if (!socket) return;

  if (useCallStore.getState().activeCall) {
    endCall(token);
  }

  try {
    const localStream = await getMediaStream(incomingCall.type);
    const peer = createPeer(token, incomingCall.caller._id);

    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
    await applyRemoteDescription(incomingCall.offer);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("accept_call", {
      callId: incomingCall.callId,
      callerId: incomingCall.caller._id,
      answer,
    });

    useCallStore.getState().startCallSession({
      callId: incomingCall.callId,
      receiverId: incomingCall.caller._id,
      type: incomingCall.type,
      status: "connecting",
      direction: "incoming",
    });
    useCallStore.getState().setStreams({ localStream, remoteStream: remoteMediaStream });
  } catch (error) {
    const details = readMediaError(error);
    setCallNotice({ tone: "rose", ...details });
    closePeerConnection();
    throw error;
  }
};

export const applyAnswer = async (answer) => {
  if (!peerConnection || !answer) return;
  await applyRemoteDescription(answer);
  clearOutgoingCallTimeout();
  useCallStore.getState().setCallStatus("connecting");
};

export const applyIceCandidate = async (candidate) => {
  if (!peerConnection || !candidate) return;

  const rtcCandidate = new RTCIceCandidate(candidate);
  if (!peerConnection.remoteDescription) {
    pendingRemoteCandidates.push(rtcCandidate);
    return;
  }

  try {
    await peerConnection.addIceCandidate(rtcCandidate);
  } catch {
    pendingRemoteCandidates.push(rtcCandidate);
  }
};

export const handleReconnectOffer = async ({ token, senderId, offer }) => {
  if (!peerConnection || !offer || !senderId) return;
  const socket = getSocket(token);
  if (!socket) return;

  await applyRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("call_reconnect_answer", { receiverId: senderId, answer });
  useCallStore.getState().setCallStatus("reconnecting");
};

export const applyReconnectAnswer = async (answer) => {
  if (!peerConnection || !answer) return;
  await applyRemoteDescription(answer);
  useCallStore.getState().setCallStatus("connecting");
};

export const endCall = (token) => {
  const { activeCall, localStream, remoteStream, clearCall } = useCallStore.getState();
  clearOutgoingCallTimeout();

  if (activeCall?.receiverId) {
    getSocket(token)?.emit("end_call", {
      callId: activeCall.callId,
      receiverId: activeCall.receiverId,
    });
  }

  localStream?.getTracks().forEach((track) => track.stop());
  remoteStream?.getTracks().forEach((track) => track.stop());
  closePeerConnection();
  clearCall();
};
