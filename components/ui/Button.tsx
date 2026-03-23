"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({
  className = "",
  variant = "primary",
  disabled,
  children,
  ...rest
}: Props) {
  const base =
    "min-h-12 min-w-12 px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-40 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "border-white bg-black text-white hover:bg-white hover:text-black"
      : "border-border bg-transparent text-muted hover:text-white hover:border-white";

  return (
    <button
      type="button"
      className={`${base} ${styles} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
