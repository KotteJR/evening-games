"use client";

import Link from "next/link";
import { SessionQR } from "@/components/session/SessionQR";

type Props = {
  roomCode: string;
  joinUrl: string;
  title: string;
  body: string;
};

export function SessionPlaceholderHost({
  roomCode,
  joinUrl,
  title,
  body,
}: Props) {
  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col px-4 py-8 max-w-lg mx-auto w-full items-center justify-center text-center gap-6">
      <Link
        href="/"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-white self-start"
      >
        ← Menu
      </Link>
      <h1 className="font-display text-2xl text-white">
        {title} · {roomCode}
      </h1>
      <SessionQR url={joinUrl} label="Scan to join" />
      <p className="font-mono text-xs text-muted leading-relaxed">{body}</p>
      <p className="font-mono text-[10px] text-dim break-all">{joinUrl}</p>
    </div>
  );
}
