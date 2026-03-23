"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { HangmanSessionHost } from "@/components/session/hangman/HangmanSessionHost";
import { DrawSessionHost } from "@/components/session/draw/DrawSessionHost";
import { DurakSessionHost } from "@/components/session/durak/DurakSessionHost";
import { UnoSessionHost } from "@/components/session/uno/UnoSessionHost";
import { BattleshipSessionHost } from "@/components/session/battleship/BattleshipSessionHost";
import { normalizeRoomCode } from "@/lib/session/roomCode";

function HostRoomInner() {
  const params = useParams();
  const sp = useSearchParams();
  const codeRaw = typeof params.code === "string" ? params.code : "";
  const code = normalizeRoomCode(decodeURIComponent(codeRaw));
  const game = sp.get("game") ?? "hangman";

  if (game === "hangman") {
    return <HangmanSessionHost roomCode={code} />;
  }
  if (game === "drawandguess") {
    return <DrawSessionHost roomCode={code} />;
  }
  if (game === "durak") {
    return <DurakSessionHost roomCode={code} />;
  }
  if (game === "uno") {
    return <UnoSessionHost roomCode={code} />;
  }
  if (game === "battleship") {
    return <BattleshipSessionHost roomCode={code} />;
  }

  return <HangmanSessionHost roomCode={code} />;
}

export default function HostRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-bg flex items-center justify-center">
          <p className="font-mono text-sm text-muted">Loading room…</p>
        </div>
      }
    >
      <HostRoomInner />
    </Suspense>
  );
}
