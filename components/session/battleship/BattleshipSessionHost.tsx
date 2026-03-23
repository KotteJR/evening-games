"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SessionQR } from "@/components/session/SessionQR";
import { useSession } from "@/lib/session/useSession";
import type { PlayerAction } from "@/lib/session/session.types";
import { SYNC_V2 } from "@/lib/session/syncEnvelope";
import { BS_SIZE, SHIP_LENGTHS } from "@/lib/games/battleship";
import {
  battleshipApplyPlayerAction,
  type FogCell,
  battleshipInitialLobby,
  battleshipRematch,
  battleshipSecretsFromFull,
  battleshipStartFromLobby,
  battleshipToPublic,
  type BattleshipFullState,
} from "@/lib/session/battleshipSessionReducer";

type Props = { roomCode: string };

function FogGrid({ fog, label }: { fog: FogCell[][]; label: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-muted mb-1">{label}</p>
      <div
        className="mx-auto grid w-full max-w-[320px] gap-0 overflow-hidden rounded-brand border border-border"
        style={{
          gridTemplateColumns: `repeat(${BS_SIZE}, minmax(0,1fr))`,
        }}
      >
        {fog.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`flex aspect-square items-center justify-center border border-border font-mono text-[10px] ${
                cell === "h"
                  ? "text-suitred"
                  : cell === "m"
                    ? "text-muted"
                    : "bg-surface"
              }`}
            >
              {cell === "h" ? "✕" : cell === "m" ? "·" : ""}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export function BattleshipSessionHost({ roomCode }: Props) {
  const pushRef = useRef<(s: unknown) => void>(() => {});
  const [full, setFull] = useState<BattleshipFullState>(() =>
    battleshipInitialLobby(),
  );
  const [started, setStarted] = useState(false);

  const pushBs = useCallback((f: BattleshipFullState) => {
    pushRef.current({
      v: SYNC_V2,
      game: "battleship",
      public: battleshipToPublic(f),
      secrets: battleshipSecretsFromFull(f),
    });
  }, []);

  const onPlayerAction = useCallback(
    (action: PlayerAction) => {
      if (action.game !== "battleship") return;
      setFull((prev) => {
        const next = battleshipApplyPlayerAction(prev, action);
        if (!next) return prev;
        pushBs(next);
        return next;
      });
    },
    [pushBs],
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
    u.searchParams.set("game", "battleship");
    return u.toString();
  }, [roomCode]);

  const start = () => {
    const next = battleshipStartFromLobby(full);
    setFull(next);
    pushBs(next);
    setStarted(true);
  };

  const again = () => {
    const next = battleshipRematch();
    setFull(next);
    pushBs(next);
  };

  const pub = battleshipToPublic(full);

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          ← Menu
        </Link>
        <h1 className="font-display text-lg text-ink">
          Battleship · {roomCode}
        </h1>
        <span
          className={`font-mono text-[10px] ${connected ? "text-ink" : "text-suitred"}`}
        >
          {connected ? "Live" : "…"}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-3xl mx-auto gap-6">
        {!started && full.phase === "lobby" ? (
          <div className="text-center space-y-6 w-full max-w-md flex flex-col items-center">
            {joinUrl ? <SessionQR url={joinUrl} label="Phones — place & fire" /> : null}
            {joinUrl ? (
              <p className="font-mono text-[10px] text-dim break-all px-2">{joinUrl}</p>
            ) : null}
            <p className="font-mono text-xs text-muted">
              {players.map((p) => `${p.name} (${p.role})`).join(" · ") ||
                "Waiting for two phones…"}
            </p>
            <Button onClick={start} disabled={!hasTwo || !connected}>
              Start — place fleets on phones
            </Button>
          </div>
        ) : null}

        {started && pub.phase !== "lobby" ? (
          <div className="w-full space-y-6 flex flex-col items-center">
            <p
              className="font-mono text-center text-sm uppercase tracking-[0.14em]"
              role="status"
            >
              {pub.lastMsg}
            </p>

            {pub.phase === "placement" ? (
              <div className="text-center space-y-2 max-w-md">
                <p className="font-mono text-xs text-muted">
                  P1: {pub.placement.shipsPlaced[0]}/5 ships ·{" "}
                  {pub.placement.ready[0] ? "Ready ✓" : "Placing…"}
                </p>
                <p className="font-mono text-xs text-muted">
                  P2: {pub.placement.shipsPlaced[1]}/5 ships ·{" "}
                  {pub.placement.ready[1] ? "Ready ✓" : "Placing…"}
                </p>
                {pub.placement.nextShip[0] ? (
                  <p className="font-mono text-[10px] text-dim">
                    P1 next: {pub.placement.nextShip[0]} (
                    {SHIP_LENGTHS[pub.placement.nextShip[0]]} cells)
                  </p>
                ) : null}
                {pub.placement.nextShip[1] ? (
                  <p className="font-mono text-[10px] text-dim">
                    P2 next: {pub.placement.nextShip[1]} (
                    {SHIP_LENGTHS[pub.placement.nextShip[1]]} cells)
                  </p>
                ) : null}
              </div>
            ) : null}

            {(pub.phase === "combat" || pub.phase === "over") && (
              <div className="grid md:grid-cols-2 gap-8 w-full">
                <FogGrid fog={pub.fog[1]} label="Player 1 view → Player 2 ocean" />
                <FogGrid fog={pub.fog[0]} label="Player 2 view → Player 1 ocean" />
              </div>
            )}

            {pub.phase === "over" ? (
              <div className="text-center space-y-3">
                <p className="font-display text-2xl">
                  Player {pub.winner} wins
                </p>
                <Button onClick={again}>Play again</Button>
              </div>
            ) : null}

            {pub.phase === "combat" ? (
              <p className="font-mono text-[10px] text-muted text-center">
                Player {pub.current}&apos;s turn — fire on your phone
              </p>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
