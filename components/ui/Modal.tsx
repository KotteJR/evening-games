"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className="w-full max-w-phone max-h-[90dvh] overflow-y-auto border border-white bg-black p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          {title ? (
            <h2
              id="modal-title"
              className="font-display text-xl text-white tracking-tight"
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          <Button variant="ghost" className="shrink-0 !min-h-10 !px-3" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="text-white/90 font-mono text-sm">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
