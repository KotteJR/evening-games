"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { generateRoomCode, normalizeRoomCode } from "@/lib/session/roomCode";

const ALLOWED = new Set([
  "hangman",
  "drawandguess",
  "durak",
  "uno",
  "battleship",
]);

function NewSessionInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const raw = sp.get("game") ?? "hangman";
    const game = ALLOWED.has(raw) ? raw : "hangman";
    const code = normalizeRoomCode(generateRoomCode());
    router.replace(`/host/${encodeURIComponent(code)}?game=${game}`);
  }, [router, sp]);

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <p className="font-mono text-sm text-muted">Creating room…</p>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-bg flex items-center justify-center">
          <p className="font-mono text-sm text-muted">Creating room…</p>
        </div>
      }
    >
      <NewSessionInner />
    </Suspense>
  );
}
