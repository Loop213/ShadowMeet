import { create } from "zustand";
import { api } from "../services/api";

const storedSession =
  typeof window !== "undefined" ? JSON.parse(localStorage.getItem("shadowmeet_active_session") || "null") : null;
const storedPartner =
  typeof window !== "undefined" ? JSON.parse(localStorage.getItem("shadowmeet_partner") || "null") : null;

export const useRandomChatStore = create((set, get) => ({
  queueStatus: "idle",
  queueSize: 0,
  onlineCount: 0,
  mode: "video",
  interestsInput: "music, coding",
  genderFilter: "any",
  activeSession: storedSession,
  partner: storedPartner,
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
    set(() => {
      const activeSession = { sessionId, mode, matchedInterests, startedAt };
      localStorage.setItem("shadowmeet_active_session", JSON.stringify(activeSession));
      localStorage.setItem("shadowmeet_partner", JSON.stringify(partner));
      return {
        queueStatus: "matched",
        activeSession,
        partner,
        sessionMessages: [],
        strangerTyping: false,
      };
    }),
  appendSessionMessage: (message) =>
    set((state) => ({ sessionMessages: [...state.sessionMessages, message] })),
  endSession: () =>
    set(() => {
      localStorage.removeItem("shadowmeet_active_session");
      localStorage.removeItem("shadowmeet_partner");
      return {
        queueStatus: "idle",
        activeSession: null,
        partner: null,
        sessionMessages: [],
        strangerTyping: false,
      };
    }),
  setStrangerTyping: (strangerTyping) => set({ strangerTyping }),
  restoreSession: ({ sessionId, partner, mode, matchedInterests, startedAt }) =>
    get().setMatch({ sessionId, partner, mode, matchedInterests, startedAt }),
  fetchMatchHistory: async () => {
    const { data } = await api.get("/sessions/history");
    set({ matchHistory: data.sessions });
  },
}));
