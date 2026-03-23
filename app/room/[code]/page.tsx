"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { HangmanSessionPhone } from "@/components/session/hangman/HangmanSessionPhone";
import { DrawSessionPhone } from "@/components/session/draw/DrawSessionPhone";
import { DurakSessionPhone } from "@/components/session/durak/DurakSessionPhone";
import { UnoSessionPhone } from "@/components/session/uno/UnoSessionPhone";
import { BattleshipSessionPhone } from "@/components/session/battleship/BattleshipSessionPhone";
import { normalizeRoomCode } from "@/lib/session/roomCode";

const STORAGE = "ng_player_name";

function RoomPhoneInner() {
  const params = useParams();
  const sp = useSearchParams();
  const codeRaw = typeof params.code === "string" ? params.code : "";
  const code = normalizeRoomCode(decodeURIComponent(codeRaw));
  const game = sp.get("game") ?? "hangman";

  const [playerName, setPlayerName] = useState("Player");
  useEffect(() => {
    try {
      setPlayerName(sessionStorage.getItem(STORAGE) || "Player");
    } catch {
      setPlayerName("Player");
    }
  }, []);

  if (game === "hangman") {
    return <HangmanSessionPhone roomCode={code} playerName={playerName} />;
  }
  if (game === "drawandguess") {
    return <DrawSessionPhone roomCode={code} playerName={playerName} />;
  }
  if (game === "durak") {
    return <DurakSessionPhone roomCode={code} playerName={playerName} />;
  }
  if (game === "uno") {
    return <UnoSessionPhone roomCode={code} playerName={playerName} />;
  }
  if (game === "battleship") {
    return <BattleshipSessionPhone roomCode={code} playerName={playerName} />;
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
      <p className="font-mono text-sm text-muted text-center">
        Phone companion for this game is not wired yet. Use one screen or check
        back soon.
      </p>
    </div>
  );
}

export default function RoomPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
          <p className="font-mono text-sm text-muted text-center">Loading…</p>
        </div>
      }
    >
      <RoomPhoneInner />
    </Suspense>
  );
}
