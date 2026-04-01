import { create } from "zustand";
import { api } from "../services/api";
import { disconnectSocket } from "../services/socket";

const storedToken = localStorage.getItem("dating_token");

export const useAuthStore = create((set, get) => ({
  token: storedToken || "",
  user: null,
  loading: false,
  authMode: "login",
  setAuthMode: (authMode) => set({ authMode }),
  bootstrap: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user });
    } catch {
      localStorage.removeItem("dating_token");
      disconnectSocket();
      set({ token: "", user: null });
    }
  },
  login: async (payload, mode = "password") => {
    set({ loading: true });
    try {
      const endpoint = mode === "otp" ? "/auth/verify-otp" : "/auth/login";
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("dating_token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.message || "Unable to login");
    }
  },
  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("dating_token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.message || "Unable to register");
    }
  },
  enterGuestMode: async (payload = {}) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/guest", payload);
      localStorage.setItem("dating_token", data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.message || "Unable to enter guest mode");
    }
  },
  requestOtp: async (email) => {
    await api.post("/auth/request-otp", { email });
  },
  logout: () => {
    localStorage.removeItem("dating_token");
    disconnectSocket();
    set({ token: "", user: null });
  },
  updateUser: (user) => set({ user }),
}));
