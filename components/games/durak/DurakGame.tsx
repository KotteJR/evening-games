"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { PlayingCard } from "@/components/games/cards/PlayingCard";
import { createDurakDeck, shuffle, type DurakCard } from "@/lib/utils/deck";
import {
  allDefended,
  canAddAttackCard,
  cardBeats,
  drawHands,
  ranksOnTable,
  removeCard,
} from "@/lib/games/durakLogic";

type Phase = "attack" | "defend" | "gameover";

type TableRow = { attack: DurakCard; defense: DurakCard | null };

type Game = {
  deck: DurakCard[];
  hands: [DurakCard[], DurakCard[]];
  table: TableRow[];
  trumpCard: DurakCard;
  trumpSuit: DurakCard["suit"];
  discard: DurakCard[];
  attacker: 1 | 2;
  defender: 1 | 2;
  phase: Phase;
  scores: [number, number];
};

const TARGET = 3;

function deal(scores: [number, number] = [0, 0]): Game {
  const full = shuffle(createDurakDeck());
  const trumpCard = full[full.length - 1]!;
  const deck = full.slice(0, -1);
  const hands: [DurakCard[], DurakCard[]] = [[], []];
  while (hands[0].length < 6 && deck.length) hands[0].push(deck.pop()!);
  while (hands[1].length < 6 && deck.length) hands[1].push(deck.pop()!);
  return {
    deck,
    hands,
    table: [],
    trumpCard,
    trumpSuit: trumpCard.suit,
    discard: [],
    attacker: 1,
    defender: 2,
    phase: "attack",
    scores,
  };
}

function afterHandsRefilled(g: Game): Game {
  const empty1 = g.hands[0].length === 0;
  const empty2 = g.hands[1].length === 0;
  if (g.deck.length > 0) return g;
  if (empty1 !== empty2) {
    const scores: [number, number] = [
      g.scores[0] + (empty2 ? 1 : 0),
      g.scores[1] + (empty1 ? 1 : 0),
    ];
    if (scores[0] >= TARGET || scores[1] >= TARGET) {
      return { ...g, phase: "gameover", scores };
    }
    return deal(scores);
  }
  return g;
}

export function DurakGame() {
  const [g, setG] = useState<Game>(() => deal());
  const [selected, setSelected] = useState<string[]>([]);
  const [defendRow, setDefendRow] = useState<number | null>(null);

  const attackerHand = g.hands[g.attacker - 1];
  const defenderHand = g.hands[g.defender - 1];

  const ranksHint = useMemo(() => {
    if (g.table.length === 0) return null;
    return Array.from(ranksOnTable(g.table)).join(", ");
  }, [g.table]);

  const passTurnUI: 1 | 2 = g.phase === "attack" ? g.attacker : g.defender;

  const toggleSel = (id: string) => {
    if (g.phase !== "attack") return;
    setSelected((s) => {
      const has = s.includes(id);
      if (has) return s.filter((x) => x !== id);
      const card = attackerHand.find((c) => c.id === id);
      if (!card) return s;
      const pretend = [...g.table];
      for (const sid of s) {
        const c = attackerHand.find((x) => x.id === sid);
        if (c) pretend.push({ attack: c, defense: null });
      }
      if (!canAddAttackCard(pretend, card, defenderHand.length)) return s;
      return [...s, id];
    });
  };

  const commitAttack = () => {
    if (g.phase !== "attack" || selected.length === 0) return;
    setG((prev) => {
      const hands: [DurakCard[], DurakCard[]] = [
        [...prev.hands[0]],
        [...prev.hands[1]],
      ];
      const ah = hands[prev.attacker - 1];
      const cards: DurakCard[] = [];
      for (const id of selected) {
        const c = removeCard(ah, id);
        if (c) cards.push(c);
      }
      const table = [
        ...prev.table,
        ...cards.map((c) => ({ attack: c, defense: null as DurakCard | null })),
      ];
      return { ...prev, hands, table, phase: "defend" };
    });
    setSelected([]);
  };

  const pickUp = () => {
    setG((prev) => {
      if (prev.phase !== "defend") return prev;
      const hands: [DurakCard[], DurakCard[]] = [
        [...prev.hands[0]],
        [...prev.hands[1]],
      ];
      const dh = hands[prev.defender - 1];
      for (const row of prev.table) {
        dh.push(row.attack);
        if (row.defense) dh.push(row.defense);
      }
      let next: Game = {
        ...prev,
        hands,
        table: [],
        phase: "attack",
      };
      drawHands(next.deck, next.hands, next.attacker, next.defender);
      next = afterHandsRefilled(next);
      return next;
    });
    setDefendRow(null);
  };

  const tryDefend = (cardId: string) => {
    if (g.phase !== "defend" || defendRow === null) return;
    const row = g.table[defendRow];
    if (!row || row.defense) return;
    const card = defenderHand.find((c) => c.id === cardId);
    if (!card || !cardBeats(row.attack, card, g.trumpSuit)) return;
    setG((prev) => {
      const hands: [DurakCard[], DurakCard[]] = [
        [...prev.hands[0]],
        [...prev.hands[1]],
      ];
      const dh = hands[prev.defender - 1];
      removeCard(dh, cardId);
      const table = prev.table.map((r, i) =>
        i === defendRow ? { ...r, defense: card } : r,
      );
      let next: Game = { ...prev, hands, table };
      if (allDefended(table)) {
        const discard = [...next.discard];
        for (const rw of table) {
          discard.push(rw.attack);
          if (rw.defense) discard.push(rw.defense);
        }
        next = {
          ...next,
          discard,
          table: [],
          attacker: next.defender,
          defender: next.attacker,
          phase: "attack",
        };
        drawHands(next.deck, next.hands, next.attacker, next.defender);
        next = afterHandsRefilled(next);
      }
      return next;
    });
    setDefendRow(null);
  };

  return (
    <GameShell title="Durak" currentPlayer={passTurnUI}>
      <ScoreBoard scores={g.scores} labels={["P1 rounds", "P2 rounds"]} />
      {g.phase === "gameover" ? (
        <div className="text-center space-y-4 mt-8">
          <p className="font-display text-3xl">Match over</p>
          <p className="font-mono text-sm text-muted">
            {g.scores[0] === g.scores[1]
              ? "Draw"
              : g.scores[0] > g.scores[1]
                ? "Player 1 wins the match"
                : "Player 2 wins the match"}
          </p>
          <Button
            onClick={() => {
              setG(deal());
              setSelected([]);
            }}
          >
            New match
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 my-4">
            <div className="flex items-center gap-2">
              <PlayingCard card={null} size="sm" />
              <span className="font-mono text-[10px] text-muted">
                Deck · {g.deck.length}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] uppercase text-muted">
                Trump
              </span>
              <PlayingCard card={g.trumpCard} size="sm" />
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted mb-2 uppercase tracking-[0.12em]">
            Attack ranks allowed: {ranksHint ?? "any opening card"}
          </p>
          <div className="grid grid-cols-2 gap-2 min-h-[100px] border border-border p-2 mb-4">
            <div className="space-y-2">
              <p className="font-mono text-[9px] text-dim uppercase">Attack</p>
              {g.table.map((r, i) => (
                <PlayingCard key={i} card={r.attack} size="sm" />
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[9px] text-dim uppercase">Defense</p>
              {g.table.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => g.phase === "defend" && setDefendRow(i)}
                  className={`flex min-h-[84px] w-full items-center justify-center border border-dashed ${
                    defendRow === i ? "border-white" : "border-border"
                  }`}
                >
                  {r.defense ? (
                    <PlayingCard card={r.defense} size="sm" />
                  ) : (
                    <span className="font-mono text-[10px] text-dim">Slot</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted mb-1">Player 2</p>
          <div className="flex flex-wrap gap-1 justify-center mb-6 min-h-[90px]">
            {g.hands[1].map((c) => (
              <PlayingCard
                key={c.id}
                card={c}
                size="sm"
                selected={selected.includes(c.id)}
                onClick={() => {
                  if (g.phase === "attack" && g.attacker === 2) toggleSel(c.id);
                  if (g.phase === "defend" && g.defender === 2) tryDefend(c.id);
                }}
              />
            ))}
          </div>

          <p className="font-mono text-[10px] text-muted mb-1">Player 1</p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {g.hands[0].map((c) => (
              <PlayingCard
                key={c.id}
                card={c}
                size="md"
                selected={selected.includes(c.id)}
                onClick={() => {
                  if (g.phase === "attack" && g.attacker === 1) toggleSel(c.id);
                  if (g.phase === "defend" && g.defender === 1) tryDefend(c.id);
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {g.phase === "attack" ? (
              <Button onClick={commitAttack} disabled={!selected.length}>
                Play attack
              </Button>
            ) : (
              <Button variant="ghost" onClick={pickUp}>
                Pick up table
              </Button>
            )}
          </div>
        </>
      )}
    </GameShell>
  );
}
