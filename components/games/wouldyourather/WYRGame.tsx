"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { WOULD_YOU_RATHER } from "@/lib/utils/words";

const ROUNDS = 15;

type Side = "A" | "B";

type Step = "p1self" | "p2self" | "p1guess" | "p2guess" | "reveal" | "discuss";

export function WYRGame() {
  const [roundIdx, setRoundIdx] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [step, setStep] = useState<Step>("p1self");
  const [p1, setP1] = useState<Side | null>(null);
  const [p2, setP2] = useState<Side | null>(null);
  const [g1, setG1] = useState<Side | null>(null);
  const [g2, setG2] = useState<Side | null>(null);

  const dilemma = WOULD_YOU_RATHER[roundIdx % WOULD_YOU_RATHER.length]!;
  const done = roundIdx >= ROUNDS;

  const indicator: 1 | 2 =
    step === "p1self" || step === "p1guess"
      ? 1
      : step === "p2self" || step === "p2guess"
        ? 2
        : 1;

  const resetRound = () => {
    setP1(null);
    setP2(null);
    setG1(null);
    setG2(null);
    setStep("p1self");
  };

  const advanceRound = () => {
    setRoundIdx((r) => r + 1);
    resetRound();
  };

  const scoreRound = (guess: Side) => {
    setG2(guess);
    setScores((prev) => {
      const n: [number, number] = [...prev];
      if (g1 === p2) n[0] += 1;
      if (guess === p1) n[1] += 1;
      return n;
    });
    setStep("reveal");
  };

  if (done) {
    return (
      <GameShell title="Would You Rather" currentPlayer={1}>
        <div className="text-center space-y-6 mt-10">
          <p className="font-display text-3xl">Final</p>
          <ScoreBoard scores={scores} labels={["P1 pts", "P2 pts"]} />
          <p className="font-mono text-sm text-muted">
            {scores[0] === scores[1]
              ? "Draw"
              : scores[0] > scores[1]
                ? "Player 1 predicted best"
                : "Player 2 predicted best"}
          </p>
          <Button
            onClick={() => {
              setRoundIdx(0);
              setScores([0, 0]);
              resetRound();
            }}
          >
            Play again
          </Button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Would You Rather" currentPlayer={indicator}>
      <ScoreBoard scores={scores} labels={["P1 pts", "P2 pts"]} />
      <p className="font-mono text-[10px] text-center text-muted mb-6">
        Round {roundIdx + 1} / {ROUNDS}
      </p>

      <p className="font-display text-[clamp(1.25rem,5vw,2rem)] leading-snug text-center mb-8 min-h-[5rem]">
        Would you rather {dilemma}
      </p>

      {step === "p1self" ? (
        <div className="space-y-4">
          <p className="font-mono text-xs text-center text-muted">
            Player 1 — your pick
          </p>
          <div className="grid grid-cols-2 min-h-[140px] gap-px border border-border">
            <button
              type="button"
              className="bg-surface-2 hover:bg-white hover:text-black font-mono text-sm uppercase tracking-[0.14em]"
              onClick={() => {
                setP1("A");
                setStep("p2self");
              }}
            >
              A
            </button>
            <button
              type="button"
              className="bg-surface-2 hover:bg-white hover:text-black font-mono text-sm uppercase tracking-[0.14em]"
              onClick={() => {
                setP1("B");
                setStep("p2self");
              }}
            >
              B
            </button>
          </div>
        </div>
      ) : null}

      {step === "p2self" ? (
        <div className="space-y-4">
          <p className="font-mono text-xs text-center text-muted">
            Player 2 — pass device · your pick
          </p>
          <div className="grid grid-cols-2 min-h-[140px] gap-px border border-border">
            <button
              type="button"
              className="bg-surface-2 hover:bg-white hover:text-black font-mono text-sm uppercase tracking-[0.14em]"
              onClick={() => {
                setP2("A");
                setStep("p1guess");
              }}
            >
              A
            </button>
            <button
              type="button"
              className="bg-surface-2 hover:bg-white hover:text-black font-mono text-sm uppercase tracking-[0.14em]"
              onClick={() => {
                setP2("B");
                setStep("p1guess");
              }}
            >
              B
            </button>
          </div>
        </div>
      ) : null}

      {step === "p1guess" ? (
        <div className="space-y-4 text-center">
          <p className="font-mono text-xs text-muted">
            Player 1 — what did Player 2 choose?
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => {
                setG1("A");
                setStep("p2guess");
              }}
            >
              They chose A
            </Button>
            <Button
              onClick={() => {
                setG1("B");
                setStep("p2guess");
              }}
            >
              They chose B
            </Button>
          </div>
        </div>
      ) : null}

      {step === "p2guess" ? (
        <div className="space-y-4 text-center">
          <p className="font-mono text-xs text-muted">
            Player 2 — what did Player 1 choose?
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => scoreRound("A")}>They chose A</Button>
            <Button onClick={() => scoreRound("B")}>They chose B</Button>
          </div>
        </div>
      ) : null}

      {step === "reveal" ? (
        <div className="space-y-8 text-center">
          <div className="animate-flip-reveal border border-border p-6 bg-surface-2 max-w-sm mx-auto">
            <p className="font-mono text-[10px] uppercase text-muted mb-2">Reveal</p>
            <p className="font-display text-lg mb-4">{dilemma}</p>
            <p className="font-mono text-sm">
              Player 1 picked {p1} · Player 2 picked {p2}
            </p>
            <p className="font-mono text-xs text-muted mt-3">
              Predictions: P1 → {g1} · P2 → {g2}
            </p>
          </div>
          <Button onClick={() => setStep("discuss")}>Talk about it</Button>
        </div>
      ) : null}

      {step === "discuss" ? (
        <div className="space-y-6 text-center">
          <p className="font-display text-2xl">Talk about it!</p>
          <Button
            onClick={() => {
              if (roundIdx + 1 >= ROUNDS) setRoundIdx(ROUNDS);
              else advanceRound();
            }}
          >
            {roundIdx + 1 >= ROUNDS ? "Finish" : "Next round"}
          </Button>
        </div>
      ) : null}
    </GameShell>
  );
}
