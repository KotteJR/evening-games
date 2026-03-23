"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useTheme } from "@/components/theme/ThemeProvider";

type Props = { url: string; label?: string };

export function SessionQR({ url, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dark = theme === "dark";
    QRCode.toCanvas(c, url, {
      color: {
        dark: dark ? "#FFFFFF" : "#141414",
        light: dark ? "#0a0a0a" : "#f4f4f1",
      },
      width: 200,
      margin: 1,
    }).catch(() => {});
  }, [url, theme]);

  return (
    <div className="flex flex-col items-center gap-3">
      {label ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
      ) : null}
      <canvas ref={ref} className="rounded-brand-lg border border-border" />
    </div>
  );
}
