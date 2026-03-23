"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { HangmanSessionHost } from "@/components/session/hangman/HangmanSessionHost";
import { DrawSessionHost } from "@/components/session/draw/DrawSessionHost";
import { SessionPlaceholderHost } from "@/components/session/SessionPlaceholderHost";
import { normalizeRoomCode } from "@/lib/session/roomCode";

function HostRoomInner() {
  const params = useParams();
  const sp = useSearchParams();
  const codeRaw = typeof params.code === "string" ? params.code : "";
  const code = normalizeRoomCode(decodeURIComponent(codeRaw));
  const game = sp.get("game") ?? "hangman";

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.origin + `/join/${encodeURIComponent(code)}`);
    u.searchParams.set("game", game);
    return u.toString();
  }, [code, game]);

  if (game === "hangman") {
    return <HangmanSessionHost roomCode={code} />;
  }
  if (game === "drawandguess") {
    return <DrawSessionHost roomCode={code} />;
  }
  if (game === "durak") {
    return (
      <SessionPlaceholderHost
        roomCode={code}
        joinUrl={joinUrl}
        title="Durak"
        body="Phone hand views for Durak are planned next. For now, use Play locally on one device, or gather around the TV and trust your partner not to peek."
      />
    );
  }
  if (game === "uno") {
    return (
      <SessionPlaceholderHost
        roomCode={code}
        joinUrl={joinUrl}
        title="Uno"
        body="Phone hand views for Uno are planned next. Use local play for full rules today."
      />
    );
  }
  if (game === "battleship") {
    return (
      <SessionPlaceholderHost
        roomCode={code}
        joinUrl={joinUrl}
        title="Battleship"
        body="Per-player grids over PartyKit are planned next. Use local pass-and-play for now."
      />
    );
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
