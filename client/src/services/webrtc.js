import { getSocket } from "./socket";
import { useCallStore } from "../store/useCallStore";

const turnUrl = import.meta.env.VITE_TURN_URL;
const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    ...(turnUrl
      ? [
          {
            urls: turnUrl,
            username: turnUsername,
            credential: turnPassword,
          },
        ]
      : []),
  ],
};

let peerConnection = null;
let remoteMediaStream = null;
let outgoingCallTimeout = null;

const clearOutgoingCallTimeout = () => {
  if (outgoingCallTimeout) {
    window.clearTimeout(outgoingCallTimeout);
    outgoingCallTimeout = null;
  }
};

const createPeer = (token, remotePeerId) => {
  const socket = getSocket(token);
  const peer = new RTCPeerConnection(rtcConfig);
  remoteMediaStream = new MediaStream();
  useCallStore.getState().setRemoteStream(remoteMediaStream);

  peer.ontrack = (event) => {
    const attachTracks = () => {
      const inboundTracks = event.streams?.[0]?.getTracks?.() || [event.track].filter(Boolean);

      inboundTracks.forEach((track) => {
        const alreadyAdded = remoteMediaStream
          ?.getTracks()
          .some((existingTrack) => existingTrack.id === track.id);

        if (!alreadyAdded) {
          remoteMediaStream?.addTrack(track);
        }
      });

      useCallStore.getState().setRemoteStream(remoteMediaStream);
      useCallStore.getState().setCallStatus("connected");
    };

    if (event.track) {
      if (event.track.readyState === "live") {
        attachTracks();
      } else {
        event.track.onunmute = () => {
          attachTracks();
        };
      }
      return;
    }

    attachTracks();
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
    const nextState = peer.connectionState;
    if (nextState === "connected") {
      useCallStore.getState().setCallStatus("connected");
    } else if (nextState === "disconnected" || nextState === "failed" || nextState === "closed") {
      useCallStore.getState().setCallStatus(nextState);
    }
  };

  peerConnection = peer;
  return peer;
};

const getMediaStream = (type) =>
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === "video",
  });

export const startOutgoingCall = async ({ token, receiverId, type }) => {
  const socket = getSocket(token);
  const localStream = await getMediaStream(type);
  const peer = createPeer(token, receiverId);

  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("call_user", { receiverId, type, offer });
  useCallStore.getState().startCallSession({ receiverId, type, status: "calling", direction: "outgoing" });
  useCallStore.getState().setStreams({ localStream, remoteStream: remoteMediaStream });
  clearOutgoingCallTimeout();
  outgoingCallTimeout = window.setTimeout(() => {
    const activeCall = useCallStore.getState().activeCall;
    if (activeCall?.status === "calling" && activeCall?.receiverId === receiverId) {
      endCall(token);
      useCallStore.getState().setCallNotice({
        tone: "amber",
        title: "Call timed out",
        message: "The other person did not answer in time.",
      });
    }
  }, 30000);
};

export const acceptIncomingCall = async ({ token, incomingCall }) => {
  const socket = getSocket(token);
  const localStream = await getMediaStream(incomingCall.type);
  const peer = createPeer(token, incomingCall.caller._id);

  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
  await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

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
    status: "connected",
    direction: "incoming",
  });
  useCallStore.getState().setStreams({ localStream, remoteStream: remoteMediaStream });
};

export const applyAnswer = async (answer) => {
  if (peerConnection && answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    clearOutgoingCallTimeout();
    useCallStore.getState().setCallStatus("connecting");
  }
};

export const applyIceCandidate = async (candidate) => {
  if (peerConnection && candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
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

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteMediaStream = null;

  localStream?.getTracks().forEach((track) => track.stop());
  remoteStream?.getTracks().forEach((track) => track.stop());
  clearCall();
};
