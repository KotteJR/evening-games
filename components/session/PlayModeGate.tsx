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
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-play flex-col px-4 pb-12 pt-10 sm:px-6">
        <header className="mb-8 w-full">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
          >
            ← Menu
          </Link>
          <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md font-mono text-xs text-muted leading-relaxed">
            Pass one phone, or use a TV / laptop as host and keep secrets on each
            player&apos;s device.
          </p>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <Button className="w-full max-w-xs" onClick={() => setMode("local")}>
            Play on this device
          </Button>
          <Link
            href={`/session/new?game=${encodeURIComponent(gameKey)}`}
            className="w-full max-w-xs"
          >
            <Button className="w-full">TV + phones (room code)</Button>
          </Link>
        </main>
      </div>
    </div>
  );
}
