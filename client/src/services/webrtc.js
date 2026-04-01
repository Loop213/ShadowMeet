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

const createPeer = (token, remotePeerId, remoteStream) => {
  const socket = getSocket(token);
  const peer = new RTCPeerConnection(rtcConfig);

  peer.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc_ice_candidate", {
        receiverId: remotePeerId,
        candidate: event.candidate,
      });
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
  const remoteStream = new MediaStream();
  const peer = createPeer(token, receiverId, remoteStream);

  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("call_user", { receiverId, type, offer });
  useCallStore.getState().startCallSession({ receiverId, type, status: "calling" });
  useCallStore.getState().setStreams({ localStream, remoteStream });
};

export const acceptIncomingCall = async ({ token, incomingCall }) => {
  const socket = getSocket(token);
  const localStream = await getMediaStream(incomingCall.type);
  const remoteStream = new MediaStream();
  const peer = createPeer(token, incomingCall.caller._id, remoteStream);

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
  });
  useCallStore.getState().setStreams({ localStream, remoteStream });
};

export const applyAnswer = async (answer) => {
  if (peerConnection && answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    const activeCall = useCallStore.getState().activeCall;
    useCallStore.getState().startCallSession({ ...activeCall, status: "connected" });
  }
};

export const applyIceCandidate = async (candidate) => {
  if (peerConnection && candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
};

export const endCall = (token) => {
  const { activeCall, localStream, remoteStream, clearCall } = useCallStore.getState();

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

  localStream?.getTracks().forEach((track) => track.stop());
  remoteStream?.getTracks().forEach((track) => track.stop());
  clearCall();
};
