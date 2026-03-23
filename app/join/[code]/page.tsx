"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/session/roomCode";

const STORAGE = "ng_player_name";

function JoinRoomInner() {
  const params = useParams();
  const sp = useSearchParams();
  const router = useRouter();
  const codeRaw = typeof params.code === "string" ? params.code : "";
  const code = normalizeRoomCode(decodeURIComponent(codeRaw));
  const game = sp.get("game") ?? "hangman";
  const [name, setName] = useState("");

  const valid = isValidRoomCode(code);

  const submit = () => {
    const n = name.trim();
    if (!n || !valid) return;
    try {
      sessionStorage.setItem(STORAGE, n);
    } catch {
      /* ignore */
    }
    router.push(`/room/${encodeURIComponent(code)}?game=${encodeURIComponent(game)}`);
  };

  if (!valid) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
        <p className="font-mono text-sm text-suitred text-center">
          Invalid room code.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col items-center justify-center px-6 max-w-phone mx-auto w-full gap-8">
      <div className="text-center space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Join room
        </p>
        <h1 className="font-display text-4xl text-white">{code}</h1>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full bg-black border border-border px-3 py-3 font-mono text-sm text-white placeholder:text-dim"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <Button onClick={submit} disabled={!name.trim()} className="w-full">
        Join
      </Button>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
          <p className="font-mono text-sm text-muted text-center">Loading…</p>
        </div>
      }
    >
      <JoinRoomInner />
    </Suspense>
  );
}
