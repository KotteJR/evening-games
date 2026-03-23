"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayingCard } from "@/components/games/cards/PlayingCard";
import { useSession } from "@/lib/session/useSession";
import { getDeviceType } from "@/lib/session/deviceType";
import type { DurakPublicState } from "@/lib/session/durakSessionReducer";
import { canAddAttackCard, ranksOnTable } from "@/lib/games/durakLogic";
import type { DurakCard } from "@/lib/utils/deck";

type Props = { roomCode: string; playerName: string };

function parseDurakSync(raw: unknown): {
  public: DurakPublicState;
  hand: DurakCard[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 2 || o.game !== "durak") return null;
  const pub = o.public as DurakPublicState;
  if (!pub || pub.game !== "durak") return null;
  const you = o.you as { hand?: DurakCard[] } | undefined;
  return { public: pub, hand: you?.hand ?? [] };
}

export function DurakSessionPhone({ roomCode, playerName }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [defendRow, setDefendRow] = useState<number | null>(null);

  const { gameState, connected, myRole, sendAction, error, connectionHint } =
    useSession({
    roomCode,
    playerName,
    deviceType: getDeviceType(),
    isHost: false,
  });

  const view = useMemo(() => parseDurakSync(gameState), [gameState]);
  const pub = view?.public;
  const hand = view?.hand ?? [];
  const role = myRole === 1 || myRole === 2 ? myRole : null;

  useEffect(() => {
    setSelected([]);
    setDefendRow(null);
  }, [pub?.table, pub?.phase]);

  const ranksHint = useMemo(() => {
    if (!pub?.table.length) return null;
    return Array.from(ranksOnTable(pub.table)).join(", ");
  }, [pub?.table]);

  const attackerHand = role && pub ? hand : [];

  const toggleSel = (id: string) => {
    if (!pub || role !== pub.attacker || pub.phase !== "attack") return;
    setSelected((s) => {
      const has = s.includes(id);
      if (has) return s.filter((x) => x !== id);
      const card = attackerHand.find((c) => c.id === id);
      if (!card) return s;
      const pretend = [...pub.table];
      for (const sid of s) {
        const c = attackerHand.find((x) => x.id === sid);
        if (c) pretend.push({ attack: c, defense: null });
      }
      const oppCount =
        role === 1 ? pub.handCounts[1] : pub.handCounts[0];
      if (!canAddAttackCard(pretend, card, oppCount)) return s;
      return [...s, id];
    });
  };

  const commitAttack = () => {
    if (!role || !selected.length) return;
    sendAction({
      game: "durak",
      action: "COMMIT_ATTACK",
      cardIds: selected,
      player: role,
    });
    setSelected([]);
  };

  const pickUp = () => {
    if (!role) return;
    sendAction({ game: "durak", action: "PICK_UP", player: role });
  };

  const tryDefend = (cardId: string) => {
    if (!role || defendRow === null || !pub) return;
    sendAction({
      game: "durak",
      action: "DEFEND",
      cardId,
      row: defendRow,
      player: role,
    });
    setDefendRow(null);
  };

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
        <p className="font-mono text-sm text-suitred text-center">{error}</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-3 max-w-md mx-auto w-full">
        {connectionHint ? (
          <p className="font-mono text-xs text-suitred text-center leading-relaxed">
            {connectionHint}
          </p>
        ) : null}
        <p className="font-mono text-sm text-muted text-center">
          {connected ? "Assigning seat…" : "Connecting…"}
        </p>
      </div>
    );
  }

  if (!pub || pub.phase === "lobby") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-4">
        <p className="font-display text-2xl text-ink">Player {role}</p>
        <p className="font-mono text-sm text-muted text-center">
          {connected
            ? "Waiting for host to start…"
            : "Connecting to room…"}
        </p>
      </div>
    );
  }

  if (pub.phase === "gameover") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-3">
        <p className="font-display text-2xl text-ink">Match over</p>
        <p className="font-mono text-xs text-muted text-center">
          Watch the TV for the winner. Host can start a new match.
        </p>
      </div>
    );
  }

  const isAttackTurn = pub.phase === "attack" && pub.attacker === role;
  const isDefendTurn = pub.phase === "defend" && pub.defender === role;

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col px-4 py-6 max-w-phone mx-auto w-full gap-4">
      <header className="flex justify-between items-start">
        <div>
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.15em]">
            Durak · You are P{role}
          </p>
          <p className="font-mono text-[10px] text-dim">
            {connected ? "Live" : "…"}
          </p>
        </div>
        <div className="text-right font-mono text-[10px] text-muted">
          Opp · {role === 1 ? pub.handCounts[1] : pub.handCounts[0]} cards
        </div>
      </header>

      <div className="flex justify-between items-center text-[10px] font-mono text-muted">
        <span>Deck {pub.deckCount}</span>
        <span>Trump {pub.trumpSuit}</span>
      </div>

      <p className="font-mono text-[10px] text-dim">
        {isAttackTurn
          ? "Your attack — select cards, then Play attack."
          : isDefendTurn
            ? "Tap a defense slot, then a card from your hand."
            : "Waiting for opponent…"}
      </p>

      {pub.phase === "attack" ? (
        <p className="font-mono text-[9px] text-muted uppercase tracking-[0.1em]">
          Ranks allowed: {ranksHint ?? "any opening card"}
        </p>
      ) : null}

      {pub.table.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 border border-border p-2">
          <div className="space-y-1">
            <p className="font-mono text-[8px] text-dim">Atk</p>
            {pub.table.map((r, i) => (
              <PlayingCard key={i} card={r.attack} size="sm" />
            ))}
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[8px] text-dim">Def</p>
            {pub.table.map((r, i) => (
              <button
                key={i}
                type="button"
                disabled={!isDefendTurn || !!r.defense}
                onClick={() => isDefendTurn && setDefendRow(i)}
                className={`flex min-h-[72px] w-full items-center justify-center border border-dashed ${
                  defendRow === i ? "border-border-strong" : "border-border"
                }`}
              >
                {r.defense ? (
                  <PlayingCard card={r.defense} size="sm" />
                ) : (
                  <span className="text-[9px] font-mono text-dim">Slot</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[10px] text-muted mb-2">Your hand</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {hand.map((c) => (
            <PlayingCard
              key={c.id}
              card={c}
              size="md"
              selected={selected.includes(c.id)}
              onClick={() => {
                if (isAttackTurn) toggleSel(c.id);
                if (isDefendTurn) tryDefend(c.id);
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        {isAttackTurn ? (
          <Button onClick={commitAttack} disabled={!selected.length}>
            Play attack
          </Button>
        ) : null}
        {isDefendTurn ? (
          <Button variant="ghost" onClick={pickUp}>
            Pick up table
          </Button>
        ) : null}
      </div>
    </div>
  );
}
