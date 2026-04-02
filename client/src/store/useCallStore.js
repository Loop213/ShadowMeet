import { create } from "zustand";

const initialCallDebug = {
  connectionState: "idle",
  iceConnectionState: "idle",
  iceGatheringState: "idle",
  signalingState: "idle",
  restartAttempts: 0,
  pendingCandidates: 0,
  localCandidates: 0,
  remoteCandidates: 0,
  remoteVideoTracks: 0,
  remoteAudioTracks: 0,
  usingTurn: false,
  iceServerCount: 0,
  lastEvent: "idle",
};

export const useCallStore = create((set) => ({
  incomingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,
  callNotice: null,
  callDebug: initialCallDebug,
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  startCallSession: (activeCall) =>
    set((state) => ({
      activeCall: { ...(state.activeCall || {}), ...activeCall },
      incomingCall: null,
      callNotice: null,
    })),
  setStreams: ({ localStream, remoteStream }) => set({ localStream, remoteStream }),
  setRemoteStream: (remoteStream) => set((state) => ({ ...state, remoteStream })),
  setCallStatus: (status) =>
    set((state) => ({
      activeCall: state.activeCall ? { ...state.activeCall, status } : state.activeCall,
    })),
  setCallDebug: (callDebugPatch) =>
    set((state) => ({
      callDebug: { ...state.callDebug, ...callDebugPatch },
    })),
  resetCallDebug: () => set({ callDebug: initialCallDebug }),
  setCallNotice: (callNotice) => set({ callNotice }),
  clearCallNotice: () => set({ callNotice: null }),
  clearCall: () =>
    set({
      incomingCall: null,
      activeCall: null,
      localStream: null,
      remoteStream: null,
      callNotice: null,
      callDebug: initialCallDebug,
    }),
}));
