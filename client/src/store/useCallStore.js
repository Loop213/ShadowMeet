import { create } from "zustand";

export const useCallStore = create((set) => ({
  incomingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  startCallSession: (activeCall) => set({ activeCall, incomingCall: null }),
  setStreams: ({ localStream, remoteStream }) => set({ localStream, remoteStream }),
  clearCall: () =>
    set({
      incomingCall: null,
      activeCall: null,
      localStream: null,
      remoteStream: null,
    }),
}));

