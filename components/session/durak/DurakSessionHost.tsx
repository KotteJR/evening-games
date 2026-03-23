"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { SessionQR } from "@/components/session/SessionQR";
import { PlayingCard } from "@/components/games/cards/PlayingCard";
import { useSession } from "@/lib/session/useSession";
import type { PlayerAction } from "@/lib/session/session.types";
import { SYNC_V2 } from "@/lib/session/syncEnvelope";
import {
  durakApplyPlayerAction,
  durakInitialLobby,
  durakSecretsFromFull,
  durakStartFromLobby,
  durakToPublic,
  type DurakFullState,
} from "@/lib/session/durakSessionReducer";
import { createDurakDeck, shuffle, type DurakCard } from "@/lib/utils/deck";

type Props = { roomCode: string };

function dealFreshMatch(): DurakFullState {
  const full = shuffle(createDurakDeck());
  const trumpCard = full[full.length - 1]!;
  const deck = full.slice(0, -1);
  const hands: [DurakCard[], DurakCard[]] = [[], []];
  while (hands[0].length < 6 && deck.length) hands[0].push(deck.pop()!);
  while (hands[1].length < 6 && deck.length) hands[1].push(deck.pop()!);
  return {
    game: "durak",
    phase: "attack",
    deck,
    hands,
    table: [],
    trumpCard,
    trumpSuit: trumpCard.suit,
    discard: [],
    attacker: 1,
    defender: 2,
    scores: [0, 0],
  };
}

export function DurakSessionHost({ roomCode }: Props) {
  const pushRef = useRef<(s: unknown) => void>(() => {});
  const [full, setFull] = useState<DurakFullState>(() => durakInitialLobby());
  const [started, setStarted] = useState(false);

  const pushDurak = useCallback((f: DurakFullState) => {
    pushRef.current({
      v: SYNC_V2,
      game: "durak",
      public: durakToPublic(f),
      secrets: durakSecretsFromFull(f),
    });
  }, []);

  const onPlayerAction = useCallback(
    (action: PlayerAction) => {
      if (action.game !== "durak") return;
      setFull((prev) => {
        const next = durakApplyPlayerAction(prev, action);
        if (!next) return prev;
        pushDurak(next);
        return next;
      });
    },
    [pushDurak],
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
    u.searchParams.set("game", "durak");
    return u.toString();
  }, [roomCode]);

  const start = () => {
    const next = durakStartFromLobby(full);
    setFull(next);
    pushDurak(next);
    setStarted(true);
  };

  const rematch = () => {
    const next = dealFreshMatch();
    setFull(next);
    pushDurak(next);
  };

  const pub = durakToPublic(full);

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          ← Menu
        </Link>
        <h1 className="font-display text-lg text-ink">Durak · {roomCode}</h1>
        <span
          className={`font-mono text-[10px] ${connected ? "text-ink" : "text-suitred"}`}
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
            <p className="font-mono text-[10px] text-muted max-w-sm">
              TV shows the table and face-down hands. Cards are only visible on each
              player&apos;s phone.
            </p>
            <Button onClick={start} disabled={!hasTwo || !connected}>
              Start game
            </Button>
          </div>
        ) : null}

        {started && pub.phase !== "lobby" ? (
          <div className="w-full space-y-6 flex flex-col items-center">
            <ScoreBoard scores={pub.scores} labels={["P1 rounds", "P2 rounds"]} />

            {pub.phase === "gameover" ? (
              <div className="text-center space-y-4 mt-4">
                <p className="font-display text-3xl">Match over</p>
                <p className="font-mono text-sm text-muted">
                  {pub.scores[0] === pub.scores[1]
                    ? "Draw"
                    : pub.scores[0] > pub.scores[1]
                      ? "Player 1 wins the match"
                      : "Player 2 wins the match"}
                </p>
                <Button onClick={rematch}>New match</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 w-full max-w-md">
                  <div className="flex items-center gap-2">
                    <PlayingCard card={null} size="sm" />
                    <span className="font-mono text-[10px] text-muted">
                      Deck · {pub.deckCount}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[10px] uppercase text-muted">
                      Trump
                    </span>
                    <PlayingCard card={pub.trumpCard} size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 min-h-[100px] border border-border p-2 w-full max-w-md">
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] text-dim uppercase">Attack</p>
                    {pub.table.map((r, i) => (
                      <PlayingCard key={i} card={r.attack} size="sm" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] text-dim uppercase">Defense</p>
                    {pub.table.map((r, i) => (
                      <div
                        key={i}
                        className="flex min-h-[84px] w-full items-center justify-center border border-dashed border-border"
                      >
                        {r.defense ? (
                          <PlayingCard card={r.defense} size="sm" />
                        ) : (
                          <span className="font-mono text-[10px] text-dim">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-md space-y-2">
                  <p className="font-mono text-[10px] text-muted">
                    Player 2 · {pub.handCounts[1]} cards
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center min-h-[90px]">
                    {Array.from({ length: pub.handCounts[1] }).map((_, i) => (
                      <PlayingCard key={i} card={null} size="sm" />
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-md space-y-2">
                  <p className="font-mono text-[10px] text-muted">
                    Player 1 · {pub.handCounts[0]} cards
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center min-h-[90px]">
                    {Array.from({ length: pub.handCounts[0] }).map((_, i) => (
                      <PlayingCard key={i} card={null} size="sm" />
                    ))}
                  </div>
                </div>

                <p className="font-mono text-xs text-muted text-center">
                  {pub.phase === "attack"
                    ? `Player ${pub.attacker}'s turn — attack from phone`
                    : `Player ${pub.defender} — defend or pick up on phone`}
                </p>
              </>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
