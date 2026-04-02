import { create } from "zustand";
import { api } from "../services/api";
import { disconnectSocket } from "../services/socket";

const storedToken = localStorage.getItem("dating_token");
const storedRefreshToken = localStorage.getItem("dating_refresh_token");
let refreshIntervalId;

export const useAuthStore = create((set, get) => ({
  token: storedToken || "",
  refreshToken: storedRefreshToken || "",
  user: null,
  loading: false,
  authMode: "login",
  setAuthMode: (authMode) => set({ authMode }),
  scheduleRefresh: () => {
    if (refreshIntervalId) window.clearInterval(refreshIntervalId);
    refreshIntervalId = window.setInterval(() => {
      useAuthStore.getState().refreshSession();
    }, 10 * 60 * 1000);
  },
  bootstrap: async () => {
    const { token, refreshToken } = get();
    if (!token && refreshToken) {
      try {
        await get().refreshSession();
      } catch {
        get().logout();
        return;
      }
    }
    if (!get().token) return;
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user });
      get().scheduleRefresh();
    } catch {
      if (refreshToken) {
        try {
          await get().refreshSession();
          const { data } = await api.get("/auth/me");
          set({ user: data.user });
          get().scheduleRefresh();
          return;
        } catch {
          get().logout();
          return;
        }
      }
      get().logout();
    }
  },
  setSession: ({ token, refreshToken, user }) => {
    localStorage.setItem("dating_token", token);
    localStorage.setItem("dating_refresh_token", refreshToken);
    set({ token, refreshToken, user, loading: false });
    get().scheduleRefresh();
  },
  login: async (payload, mode = "password") => {
    set({ loading: true });
    try {
      const endpoint = mode === "otp" ? "/auth/verify-otp" : "/auth/login";
      const { data } = await api.post(endpoint, payload);
      get().setSession(data);
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.message || "Unable to login");
    }
  },
  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", payload);
      get().setSession(data);
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.message || "Unable to register");
    }
  },
  enterGuestMode: async (payload = {}) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/guest", payload);
      get().setSession(data);
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.message || "Unable to enter guest mode");
    }
  },
  refreshSession: async () => {
    const refreshToken = get().refreshToken || localStorage.getItem("dating_refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    let data;
    try {
      ({ data } = await api.post("/auth/refresh", { refreshToken }));
    } catch (error) {
      if (error?.response?.status !== 404) {
        throw error;
      }
      ({ data } = await api.post("/auth/refresh-token", { refreshToken }));
    }

    localStorage.setItem("dating_token", data.token);
    localStorage.setItem("dating_refresh_token", data.refreshToken);
    set({ token: data.token, refreshToken: data.refreshToken, user: data.user });
    return data;
  },
  requestOtp: async (email) => {
    await api.post("/auth/request-otp", { email });
  },
  logout: () => {
    const refreshToken = get().refreshToken || localStorage.getItem("dating_refresh_token");
    if (refreshToken) {
      api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
    if (refreshIntervalId) window.clearInterval(refreshIntervalId);
    localStorage.removeItem("dating_token");
    localStorage.removeItem("dating_refresh_token");
    disconnectSocket();
    set({ token: "", refreshToken: "", user: null });
  },
  updateUser: (user) => set({ user }),
}));
