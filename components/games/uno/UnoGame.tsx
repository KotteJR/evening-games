"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { Modal } from "@/components/ui/Modal";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { UnoCardBack, UnoCardFace } from "@/components/games/uno/UnoCardFace";
import {
  createUnoDeck,
  shuffle,
  type UnoCard,
  type UnoColor,
} from "@/lib/utils/deck";
import {
  canPlayCard,
  effectForCard,
  isWild,
  scoreHand,
  topDiscard,
} from "@/lib/games/unoLogic";

const TARGET = 500;

type Phase = "playing" | "choosingColor" | "gameover";

type Game = {
  deck: UnoCard[];
  hands: [UnoCard[], UnoCard[]];
  discard: UnoCard[];
  currentPlayer: 1 | 2;
  currentColor: UnoColor;
  direction: 1 | -1;
  scores: [number, number];
  phase: Phase;
  pendingWild: UnoCard | null;
  unoAcknowledged: boolean;
};

function flipPlayer(p: 1 | 2, times: number): 1 | 2 {
  let x = p;
  for (let i = 0; i < times; i++) x = x === 1 ? 2 : 1;
  return x;
}

function drawFromPile(prev: Game): {
  deck: UnoCard[];
  discard: UnoCard[];
  card: UnoCard | null;
} {
  let deck = [...prev.deck];
  let discard = [...prev.discard];
  if (!deck.length && discard.length > 1) {
    const top = discard[discard.length - 1]!;
    const rest = discard.slice(0, -1);
    deck = shuffle(rest);
    discard = [top];
  }
  if (!deck.length) return { deck, discard, card: null };
  const card = deck.pop()!;
  return { deck, discard, card };
}

function freshRound(scores: [number, number]): Game {
  const deck = shuffle(createUnoDeck());
  const hands: [UnoCard[], UnoCard[]] = [[], []];
  for (let i = 0; i < 7; i++) {
    hands[0].push(deck.pop()!);
    hands[1].push(deck.pop()!);
  }
  const discard: UnoCard[] = [];
  let starter: UnoCard | undefined;
  while (deck.length) {
    const c = deck.pop()!;
    discard.push(c);
    if (!isWild(c)) {
      starter = c;
      break;
    }
  }
  if (!starter) starter = discard[discard.length - 1]!;
  const currentColor =
    starter.color === "wild" ? ("solid" as UnoColor) : starter.color;
  return {
    deck,
    hands,
    discard,
    currentPlayer: 1,
    currentColor,
    direction: 1,
    scores,
    phase: "playing",
    pendingWild: null,
    unoAcknowledged: false,
  };
}

export function UnoGame() {
  const [g, setG] = useState<Game>(() => freshRound([0, 0]));
  const [pick, setPick] = useState<string | null>(null);

  const faceTop = useMemo(() => topDiscard(g.discard), [g.discard]);

  const hand = g.hands[g.currentPlayer - 1];
  const mustUno = hand.length === 1 && !g.unoAcknowledged;

  const topForPlay = g.discard[g.discard.length - 1]!;

  const applyWinOrContinue = (
    base: Game,
    winner: 1 | 2,
  ): Game => {
    const loser = winner === 1 ? 2 : 1;
    const pts = scoreHand(base.hands[loser - 1]);
    const scores: [number, number] = [...base.scores];
    scores[winner - 1] += pts;
    if (scores[0] >= TARGET || scores[1] >= TARGET) {
      return { ...base, phase: "gameover", scores };
    }
    return freshRound(scores);
  };

  const playCard = (card: UnoCard) => {
    setG((prev) => {
      if (prev.phase !== "playing") return prev;
      const h = [...prev.hands[prev.currentPlayer - 1]];
      const idx = h.findIndex((c) => c.id === card.id);
      if (idx < 0) return prev;
      if (h.length === 1 && !prev.unoAcknowledged) return prev;
      const topC = prev.discard[prev.discard.length - 1];
      if (!topC) return prev;
      if (!canPlayCard(card, topC, prev.currentColor)) return prev;

      h.splice(idx, 1);
      const hands: [UnoCard[], UnoCard[]] = [
        [...prev.hands[0]],
        [...prev.hands[1]],
      ];
      hands[prev.currentPlayer - 1] = h;
      const discard = [...prev.discard, card];

      if (isWild(card)) {
        return {
          ...prev,
          hands,
          discard,
          phase: "choosingColor" as const,
          pendingWild: card,
        };
      }

      const { color, effect } = effectForCard(card);
      let next: Game = {
        ...prev,
        hands,
        discard,
        currentColor: color,
        pendingWild: null,
      };

      if (h.length === 0) {
        return applyWinOrContinue(next, prev.currentPlayer);
      }

      const victim = flipPlayer(prev.currentPlayer, 1);

      if (effect.kind === "draw") {
        let deck = [...next.deck];
        let discardP = [...next.discard];
        const vh = [...next.hands[victim - 1]];
        const n = effect.n;
        for (let i = 0; i < n; i++) {
          const r = drawFromPile({ ...next, deck, discard: discardP });
          deck = r.deck;
          discardP = r.discard;
          if (!r.card) break;
          vh.push(r.card);
        }
        const nh: [UnoCard[], UnoCard[]] = [...next.hands];
        nh[victim - 1] = vh;
        next = {
          ...next,
          hands: nh,
          deck,
          discard: discardP,
          currentPlayer: flipPlayer(prev.currentPlayer, 2),
          unoAcknowledged: false,
        };
        return next;
      }

      const flips = effect.kind === "none" ? 1 : 2;
      next = {
        ...next,
        currentPlayer: flipPlayer(prev.currentPlayer, flips),
        unoAcknowledged: false,
      };
      return next;
    });
    setPick(null);
  };

  const confirmWild = (chosen: UnoColor) => {
    setG((prev) => {
      if (!prev.pendingWild) return prev;
      const { effect } = effectForCard(prev.pendingWild, chosen);
      const next: Game = {
        ...prev,
        phase: "playing",
        pendingWild: null,
        currentColor: chosen,
      };
      const h = next.hands[next.currentPlayer - 1];
      if (h.length === 0) {
        return applyWinOrContinue(next, next.currentPlayer);
      }
      const victim = flipPlayer(next.currentPlayer, 1);
      if (effect.kind === "draw") {
        let deck = [...next.deck];
        let discardP = [...next.discard];
        const vh = [...next.hands[victim - 1]];
        for (let i = 0; i < 4; i++) {
          const r = drawFromPile({ ...next, deck, discard: discardP });
          deck = r.deck;
          discardP = r.discard;
          if (!r.card) break;
          vh.push(r.card);
        }
        const nh: [UnoCard[], UnoCard[]] = [...next.hands];
        nh[victim - 1] = vh;
        return {
          ...next,
          hands: nh,
          deck,
          discard: discardP,
          currentPlayer: flipPlayer(next.currentPlayer, 2),
          unoAcknowledged: false,
        };
      }
      return {
        ...next,
        currentPlayer: flipPlayer(next.currentPlayer, 1),
        unoAcknowledged: false,
      };
    });
  };

  const drawOne = () => {
    setG((prev) => {
      if (prev.phase !== "playing") return prev;
      const { deck, discard, card } = drawFromPile(prev);
      if (!card) return prev;
      const hands: [UnoCard[], UnoCard[]] = [
        [...prev.hands[0]],
        [...prev.hands[1]],
      ];
      const h = [...hands[prev.currentPlayer - 1]];
      h.push(card);
      hands[prev.currentPlayer - 1] = h;
      return {
        ...prev,
        deck,
        discard,
        hands,
        unoAcknowledged: h.length === 1 ? false : prev.unoAcknowledged,
      };
    });
  };

  return (
    <GameShell title="Uno" currentPlayer={g.currentPlayer}>
      <ScoreBoard scores={g.scores} labels={["P1 pts", "P2 pts"]} />
      <p className="font-mono text-[10px] text-center text-muted mb-4">
        First to {TARGET} · Current color: {g.currentColor}
      </p>

      {g.phase === "gameover" ? (
        <div className="text-center space-y-4 mt-8">
          <p className="font-display text-3xl">Game</p>
          <p className="font-mono text-sm text-muted">
            {g.scores[0] > g.scores[1]
              ? "Player 1 wins"
              : g.scores[1] > g.scores[0]
                ? "Player 2 wins"
                : "Draw"}
          </p>
          <Button onClick={() => setG(freshRound([0, 0]))}>New game</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-muted">Draw</span>
              <UnoCardBack onClick={drawOne} />
              <span className="font-mono text-[10px] text-dim">{g.deck.length}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-muted">Discard</span>
              {faceTop ? <UnoCardFace card={faceTop} /> : null}
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted mb-1 text-center">
            Player 2 · {g.hands[1].length} cards
          </p>
          <div className="flex flex-wrap justify-center gap-1 mb-6 opacity-90">
            {g.hands[1].map((c) => (
              <UnoCardBack key={c.id} small />
            ))}
          </div>

          <p className="font-mono text-[10px] text-muted mb-1 text-center">
            Player 1 · your hand
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {g.hands[0].map((c) => {
              const playable =
                g.currentPlayer === 1 &&
                g.phase === "playing" &&
                canPlayCard(c, topForPlay, g.currentColor);
              return (
                <UnoCardFace
                  key={c.id}
                  card={c}
                  selected={pick === c.id}
                  onClick={() => {
                    if (g.currentPlayer !== 1 || g.phase !== "playing") return;
                    if (!playable) return;
                    setPick(c.id);
                    playCard(c);
                  }}
                />
              );
            })}
          </div>

          {g.currentPlayer === 2 && g.phase === "playing" ? (
            <div className="border-t border-border pt-4 mt-2">
              <p className="font-mono text-[10px] text-center text-muted mb-2">
                Player 2 turn
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {g.hands[1].map((c) => {
                  const playable = canPlayCard(c, topForPlay, g.currentColor);
                  return (
                    <UnoCardFace
                      key={c.id}
                      card={c}
                      selected={pick === c.id}
                      onClick={() => {
                        if (!playable) return;
                        setPick(c.id);
                        playCard(c);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Button variant="ghost" onClick={drawOne} disabled={g.phase !== "playing"}>
              Draw
            </Button>
            {mustUno && (
              <Button onClick={() => setG((p) => ({ ...p, unoAcknowledged: true }))}>
                UNO!
              </Button>
            )}
          </div>
          {mustUno ? (
            <p className="font-mono text-[10px] text-suitred text-center mt-2">
              Call UNO! before playing your last card.
            </p>
          ) : null}
        </>
      )}

      <Modal
        open={g.phase === "choosingColor"}
        title="Choose pattern"
        onClose={() => {}}
      >
        <div className="grid grid-cols-2 gap-3">
          {(["stripes", "dots", "hatching", "solid"] as const).map((c) => (
            <Button key={c} onClick={() => confirmWild(c)}>
              {c}
            </Button>
          ))}
        </div>
      </Modal>
    </GameShell>
  );
}
