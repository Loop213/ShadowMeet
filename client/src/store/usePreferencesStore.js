import { create } from "zustand";

const readStored = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
};

export const usePreferencesStore = create((set) => ({
  notificationsEnabled: readStored("shadowmeet_notifications", true),
  autoplayVideo: readStored("shadowmeet_autoplay_video", true),
  subtleMotion: readStored("shadowmeet_subtle_motion", false),
  setPreference: (key, value) =>
    set(() => {
      localStorage.setItem(`shadowmeet_${key}`, String(value));
      return {
        ...(key === "notifications" ? { notificationsEnabled: value } : {}),
        ...(key === "autoplay_video" ? { autoplayVideo: value } : {}),
        ...(key === "subtle_motion" ? { subtleMotion: value } : {}),
      };
    }),
}));

