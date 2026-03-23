import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        dim: "var(--text-dim)",
        accent: "var(--accent)",
        suitred: "var(--red)",
        card: "var(--card-surface)",
        ring: "var(--ring)",
        "ring-offset": "var(--ring-offset)",
      },
      borderRadius: {
        brand: "var(--radius)",
        "brand-lg": "var(--radius-lg)",
      },
      maxWidth: {
        phone: "420px",
        play: "28rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
