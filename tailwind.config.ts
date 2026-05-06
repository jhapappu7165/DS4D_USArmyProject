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
          black: "#0f172a",
          panel: "#ffffff",
          surface: "#f1f5f9",
          border: "#cbd5e1",
          muted: "#475569",
          accent: "#a67c2d",
          amber: "#b45309",
          red: "#b91c1c",
          green: "#15803d",
          cyan: "#0e7490",
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
