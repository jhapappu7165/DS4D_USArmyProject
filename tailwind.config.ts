import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          black: "#0a0c0d",
          panel: "#111618",
          border: "#2a3238",
          muted: "#7d8a92",
          accent: "#c4a35a",
          amber: "#e8a838",
          red: "#c42b2b",
          green: "#4a9d6f",
          cyan: "#3d8b9e",
        },
      },
      fontFamily: {
        display: ["var(--font-rajdhani)", "system-ui", "sans-serif"],
        mono: ["var(--font-share-tech)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(196, 163, 90, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(196, 163, 90, 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
