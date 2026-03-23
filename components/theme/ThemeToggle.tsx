"use client";

import { useTheme } from "./ThemeProvider";

type Props = { className?: string };

export function ThemeToggle({ className = "" }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] ${className}`}
      aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
