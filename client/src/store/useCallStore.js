import { create } from "zustand";

export const useCallStore = create((set) => ({
  incomingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,
  callNotice: null,
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
  setCallNotice: (callNotice) => set({ callNotice }),
  clearCallNotice: () => set({ callNotice: null }),
  clearCall: () =>
    set({
      incomingCall: null,
      activeCall: null,
      localStream: null,
      remoteStream: null,
      callNotice: null,
    }),
}));
