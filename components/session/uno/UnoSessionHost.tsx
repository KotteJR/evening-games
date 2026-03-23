"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { SessionQR } from "@/components/session/SessionQR";
import { UnoCardBack, UnoCardFace } from "@/components/games/uno/UnoCardFace";
import { useSession } from "@/lib/session/useSession";
import type { PlayerAction } from "@/lib/session/session.types";
import { SYNC_V2 } from "@/lib/session/syncEnvelope";
import { topDiscard } from "@/lib/games/unoLogic";
import {
  unoApplyPlayerAction,
  unoInitialLobby,
  unoRematch,
  unoSecretsFromFull,
  unoStartFromLobby,
  unoToPublic,
  type UnoFullState,
} from "@/lib/session/unoSessionReducer";

type Props = { roomCode: string };

export function UnoSessionHost({ roomCode }: Props) {
  const pushRef = useRef<(s: unknown) => void>(() => {});
  const [full, setFull] = useState<UnoFullState>(() => unoInitialLobby());
  const [started, setStarted] = useState(false);

  const pushUno = useCallback((f: UnoFullState) => {
    pushRef.current({
      v: SYNC_V2,
      game: "uno",
      public: unoToPublic(f),
      secrets: unoSecretsFromFull(f),
    });
  }, []);

  const onPlayerAction = useCallback(
    (action: PlayerAction) => {
      if (action.game !== "uno") return;
      setFull((prev) => {
        const next = unoApplyPlayerAction(prev, action);
        if (!next) return prev;
        pushUno(next);
        return next;
      });
    },
    [pushUno],
  );

  const { players, connected, pushState } = useSession({
    roomCode,
    playerName: "TV",
    deviceType: "desktop",
    isHost: true,
    onPlayerAction,
  });

  pushRef.current = pushState;

  const hasTwo =
    players.filter((p) => p.role === 1 || p.role === 2).length >= 2;

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(
      `${window.location.origin}/join/${encodeURIComponent(roomCode)}`,
    );
    u.searchParams.set("game", "uno");
    return u.toString();
  }, [roomCode]);

  const start = () => {
    const next = unoStartFromLobby(full);
    setFull(next);
    pushUno(next);
    setStarted(true);
  };

  const rematch = () => {
    const next = unoRematch();
    setFull(next);
    pushUno(next);
  };

  const pub = unoToPublic(full);
  const faceTop = topDiscard(pub.discard);

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-white"
        >
          ← Menu
        </Link>
        <h1 className="font-display text-lg text-white">Uno · {roomCode}</h1>
        <span
          className={`font-mono text-[10px] ${connected ? "text-white" : "text-suitred"}`}
        >
          {connected ? "Live" : "…"}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-2xl mx-auto">
        {!started && full.phase === "lobby" ? (
          <div className="text-center space-y-6 w-full max-w-md flex flex-col items-center">
            {joinUrl ? <SessionQR url={joinUrl} label="Phones — your hand only" /> : null}
            {joinUrl ? (
              <p className="font-mono text-[10px] text-dim break-all px-2">{joinUrl}</p>
            ) : null}
            <p className="font-mono text-xs text-muted">
              {players.map((p) => `${p.name} (${p.role})`).join(" · ") ||
                "Waiting for two phones…"}
            </p>
            <Button onClick={start} disabled={!hasTwo || !connected}>
              Start game
            </Button>
          </div>
        ) : null}

        {started && pub.phase !== "lobby" ? (
          <div className="w-full space-y-6 flex flex-col items-center">
            <ScoreBoard scores={pub.scores} labels={["P1 pts", "P2 pts"]} />
            <p className="font-mono text-[10px] text-center text-muted">
              Color in play: {pub.currentColor} · Turn: Player {pub.currentPlayer}
            </p>

            {pub.phase === "gameover" ? (
              <div className="text-center space-y-4 mt-4">
                <p className="font-display text-3xl">Game</p>
                <p className="font-mono text-sm text-muted">
                  {pub.scores[0] > pub.scores[1]
                    ? "Player 1 wins"
                    : pub.scores[1] > pub.scores[0]
                      ? "Player 2 wins"
                      : "Draw"}
                </p>
                <Button onClick={rematch}>New game</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-8 mb-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[9px] text-muted">Draw pile</span>
                    <UnoCardBack />
                    <span className="font-mono text-[10px] text-dim">
                      {pub.deckCount}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[9px] text-muted">Discard</span>
                    {faceTop ? <UnoCardFace card={faceTop} /> : null}
                  </div>
                </div>

                <div className="w-full max-w-md space-y-3">
                  <p className="font-mono text-[10px] text-muted text-center">
                    Player 1 · {pub.handCounts[0]} cards
                  </p>
                  <div className="flex flex-wrap justify-center gap-1 min-h-[48px]">
                    {Array.from({ length: pub.handCounts[0] }).map((_, i) => (
                      <UnoCardBack key={i} small />
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-md space-y-3">
                  <p className="font-mono text-[10px] text-muted text-center">
                    Player 2 · {pub.handCounts[1]} cards
                  </p>
                  <div className="flex flex-wrap justify-center gap-1 min-h-[48px]">
                    {Array.from({ length: pub.handCounts[1] }).map((_, i) => (
                      <UnoCardBack key={i} small />
                    ))}
                  </div>
                </div>

                {pub.phase === "choosingColor" ? (
                  <p className="font-mono text-xs text-suitred text-center">
                    Player {pub.currentPlayer}: choose wild color on your phone
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
