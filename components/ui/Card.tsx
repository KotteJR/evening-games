import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...rest }: Props) {
  return (
    <div
      className={`rounded-brand-lg border border-border bg-[var(--card-surface)] text-black p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
