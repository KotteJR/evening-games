"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  gameKey: string;
  title: string;
  children: React.ReactNode;
};

export function PlayModeGate({ gameKey, title, children }: Props) {
  const [mode, setMode] = useState<"pick" | "local">("pick");

  if (mode === "local") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-4 py-4 max-w-phone mx-auto w-full">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-white"
        >
          ← Menu
        </Link>
        <h1 className="font-display text-2xl text-white mt-4">{title}</h1>
        <p className="font-mono text-xs text-muted mt-2 leading-relaxed">
          Pass one phone, or use a TV / laptop as host and keep secrets on each
          player&apos;s device.
        </p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-12 max-w-phone mx-auto w-full">
        <Button className="w-full max-w-xs" onClick={() => setMode("local")}>
          Play on this device
        </Button>
        <Link href={`/session/new?game=${encodeURIComponent(gameKey)}`} className="w-full max-w-xs">
          <Button className="w-full">TV + phones (room code)</Button>
        </Link>
      </main>
    </div>
  );
}
