/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0f172a",
        panelSoft: "#111c33",
        accent: "#14b8a6",
        accentWarm: "#f97316",
        line: "rgba(148, 163, 184, 0.14)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(20, 184, 166, 0.18), 0 24px 80px rgba(15, 23, 42, 0.45)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(20,184,166,0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(249,115,22,0.16), transparent 28%)",
      },
    },
  },
  plugins: [],
};

