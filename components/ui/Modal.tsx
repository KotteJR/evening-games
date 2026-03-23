"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--modal-backdrop)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="document"
        className="relative z-10 w-full max-w-phone max-h-[90dvh] overflow-y-auto rounded-brand-lg border border-border p-6 shadow-lg"
        style={{ background: "var(--modal-surface)", color: "var(--text)" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {title ? (
          <header className="mb-4 flex items-start justify-between gap-4">
            <h2
              id="modal-title"
              className="font-display text-xl tracking-tight text-ink"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
            >
              Close
            </button>
          </header>
        ) : null}
        <div className="font-mono text-sm text-ink/90">{children}</div>
      </div>
    </div>
  );
}
