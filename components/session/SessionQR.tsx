"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = { url: string; label?: string };

export function SessionQR({ url, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    QRCode.toCanvas(c, url, {
      color: { dark: "#FFFFFF", light: "#000000" },
      width: 200,
      margin: 1,
    }).catch(() => {});
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3">
      {label ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
      ) : null}
      <canvas ref={ref} className="rounded-brand border border-border" />
    </div>
  );
}
