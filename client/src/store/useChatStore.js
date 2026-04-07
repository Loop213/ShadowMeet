import { create } from "zustand";
import { api } from "../services/api";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  globalMessages: [],
  privateMessages: {},
  discoverUsers: [],
  onlineUsers: [],
  selectedChat: { scope: "global", peer: null },
  typingUsers: {},
  messageStatuses: {},
  swipeHistory: {},
  sendState: "idle",
  setSelectedChat: (selectedChat) => set({ selectedChat }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setTypingState: (key, value) =>
    set((state) => ({ typingUsers: { ...state.typingUsers, [key]: value } })),
  setMessageStatus: (messageId, status) =>
    set((state) => ({
      messageStatuses: {
        ...state.messageStatuses,
        [messageId]: { ...(state.messageStatuses[messageId] || {}), ...status },
      },
    })),
  fetchBootstrap: async () => {
    const [{ data: globalData }, { data: discoverData }, { data: onlineData }] = await Promise.all([
      api.get("/messages/global"),
      api.get("/users/discover"),
      api.get("/users/online"),
    ]);

    set({
      globalMessages: globalData.messages,
      discoverUsers: discoverData.users,
      onlineUsers: onlineData.users,
    });
  },
  fetchPrivateMessages: async (peerId) => {
    const { data } = await api.get(`/messages/private/${peerId}`);
    set((state) => ({
      privateMessages: {
        ...state.privateMessages,
        [peerId]: data.messages,
      },
    }));
  },
  appendMessage: (message) =>
    set((state) => {
      if (message.chatScope === "global") {
        return { globalMessages: [...state.globalMessages, message] };
      }

      const currentUserId = useAuthStore.getState().user?._id;
      const senderId = message.senderId?._id || message.senderId;
      const receiverId = message.receiverId?._id || message.receiverId;
      const peerId = senderId === currentUserId ? receiverId : senderId;

      return {
        privateMessages: {
          ...state.privateMessages,
          [peerId]: [...(state.privateMessages[peerId] || []), message],
        },
      };
    }),
  updatePresence: ({ userId, isOnline, lastSeen, status, user }) =>
    set((state) => {
      const presencePatch = {
        _id: userId,
        ...(user || {}),
        isOnline,
        status: status || (isOnline ? "online" : "offline"),
        lastSeen,
      };

      const patchUser = (entry) => (entry._id === userId ? { ...entry, ...presencePatch } : entry);
      const onlineUsers = isOnline
        ? state.onlineUsers.some((entry) => entry._id === userId)
          ? state.onlineUsers.map(patchUser)
          : [presencePatch, ...state.onlineUsers]
        : state.onlineUsers.filter((entry) => entry._id !== userId);

      return {
        discoverUsers: state.discoverUsers.map(patchUser),
        onlineUsers,
        selectedChat:
          state.selectedChat.peer?._id === userId
            ? {
                ...state.selectedChat,
                peer: { ...state.selectedChat.peer, ...presencePatch },
              }
            : state.selectedChat,
      };
    }),
  setDiscoverUsers: (discoverUsers) => set({ discoverUsers }),
  reactToMessage: async (messageId, emoji) => {
    const { data } = await api.post(`/messages/${messageId}/reactions`, { emoji });
    set((state) => {
      const patchCollection = (messages = []) =>
        messages.map((message) => (message._id === messageId ? data.message : message));

      const privateMessages = Object.fromEntries(
        Object.entries(state.privateMessages).map(([key, messages]) => [key, patchCollection(messages)])
      );

      return {
        globalMessages: patchCollection(state.globalMessages),
        privateMessages,
      };
    });
  },
  registerSwipe: (userId, choice) =>
    set((state) => ({
      swipeHistory: { ...state.swipeHistory, [userId]: choice },
    })),
}));
