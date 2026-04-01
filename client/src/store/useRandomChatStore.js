import { create } from "zustand";
import { api } from "../services/api";

export const useRandomChatStore = create((set, get) => ({
  queueStatus: "idle",
  queueSize: 0,
  onlineCount: 0,
  mode: "video",
  interestsInput: "music, coding",
  genderFilter: "any",
  activeSession: null,
  partner: null,
  sessionMessages: [],
  strangerTyping: false,
  matchHistory: [],
  setMode: (mode) => set({ mode }),
  setInterestsInput: (interestsInput) => set({ interestsInput }),
  setGenderFilter: (genderFilter) => set({ genderFilter }),
  setQueueState: ({ queueStatus, queueSize }) =>
    set((state) => ({
      queueStatus: queueStatus ?? state.queueStatus,
      queueSize: queueSize ?? state.queueSize,
    })),
  setOnlineCount: (onlineCount) => set({ onlineCount }),
  startSearching: () => set({ queueStatus: "searching", sessionMessages: [], activeSession: null, partner: null }),
  setMatch: ({ sessionId, partner, mode, matchedInterests, startedAt }) =>
    set({
      queueStatus: "matched",
      activeSession: { sessionId, mode, matchedInterests, startedAt },
      partner,
      sessionMessages: [],
      strangerTyping: false,
    }),
  appendSessionMessage: (message) =>
    set((state) => ({ sessionMessages: [...state.sessionMessages, message] })),
  endSession: () =>
    set({
      queueStatus: "idle",
      activeSession: null,
      partner: null,
      sessionMessages: [],
      strangerTyping: false,
    }),
  setStrangerTyping: (strangerTyping) => set({ strangerTyping }),
  fetchMatchHistory: async () => {
    const { data } = await api.get("/sessions/history");
    set({ matchHistory: data.sessions });
  },
}));

