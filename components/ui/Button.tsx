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
    "min-h-12 min-w-12 rounded-brand px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:opacity-40 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "border-[color:var(--btn-primary-border)] bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-fg)] hover:bg-[color:var(--btn-primary-hover-bg)] hover:text-[color:var(--btn-primary-hover-fg)]"
      : "border-border bg-transparent text-muted hover:text-ink hover:border-border-strong";

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
