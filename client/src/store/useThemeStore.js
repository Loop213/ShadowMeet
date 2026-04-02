import { create } from "zustand";

const storedTheme =
  typeof window !== "undefined" ? localStorage.getItem("shadowmeet_theme") || "dark" : "dark";

const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("theme-light", theme === "light");
  document.documentElement.style.colorScheme = theme;
};

export const useThemeStore = create((set) => ({
  theme: storedTheme,
  initializeTheme: () => applyTheme(storedTheme),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("shadowmeet_theme", nextTheme);
      applyTheme(nextTheme);
      return { theme: nextTheme };
    }),
}));

