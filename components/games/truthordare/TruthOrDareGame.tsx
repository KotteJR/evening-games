"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { DARE_PROMPTS, TRUTH_PROMPTS } from "@/lib/utils/words";

type Phase = "choose" | "prompt" | "gameover";

type Prompt = { type: "truth" | "dare"; text: string };

type State = {
  round: number;
  maxRounds: number;
  currentPlayer: 1 | 2;
  scores: [number, number];
  usedTruths: number[];
  usedDares: number[];
  currentPrompt: Prompt | null;
  phase: Phase;
};

function pickUnused(max: number, used: Set<number>): number {
  if (used.size >= max) return Math.floor(Math.random() * max);
  let n = Math.floor(Math.random() * max);
  let guard = 0;
  while (used.has(n) && guard++ < max * 2) {
    n = (n + 1) % max;
  }
  return n;
}

const initial: State = {
  round: 1,
  maxRounds: 10,
  currentPlayer: 1,
  scores: [0, 0],
  usedTruths: [],
  usedDares: [],
  currentPrompt: null,
  phase: "choose",
};

export function TruthOrDareGame() {
  const [state, setState] = useState<State>(initial);
  const [visible, setVisible] = useState("");

  const promptText = state.currentPrompt?.text ?? "";

  useEffect(() => {
    if (state.phase !== "prompt" || !promptText) {
      setVisible("");
      return;
    }
    setVisible("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisible(promptText.slice(0, i));
      if (i >= promptText.length) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [state.phase, state.currentPrompt, promptText]);

  const truthSet = useMemo(() => new Set(state.usedTruths), [state.usedTruths]);
  const dareSet = useMemo(() => new Set(state.usedDares), [state.usedDares]);

  const choose = (type: "truth" | "dare") => {
    const list = type === "truth" ? TRUTH_PROMPTS : DARE_PROMPTS;
    const used = type === "truth" ? truthSet : dareSet;
    const idx = pickUnused(list.length, used);
    const text = list[idx]!;
    setState((s) => ({
      ...s,
      phase: "prompt",
      currentPrompt: { type, text },
      usedTruths: type === "truth" ? [...s.usedTruths, idx] : s.usedTruths,
      usedDares: type === "dare" ? [...s.usedDares, idx] : s.usedDares,
    }));
  };

  const complete = (delta: 0 | 1) => {
    setState((s) => {
      const scores: [number, number] = [...s.scores];
      if (delta) scores[s.currentPlayer - 1] += 1;
      const nextRound = s.round + 1;
      const gameover = nextRound > s.maxRounds;
      return {
        ...s,
        scores,
        round: gameover ? s.round : nextRound,
        currentPlayer: s.currentPlayer === 1 ? 2 : 1,
        currentPrompt: null,
        phase: gameover ? "gameover" : "choose",
      };
    });
  };

  return (
    <GameShell title="Truth or Dare" currentPlayer={state.currentPlayer}>
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div />
        <div className="w-36">
          <ScoreBoard scores={state.scores} />
          <p className="font-mono text-[10px] text-muted text-right">
            Round {Math.min(state.round, state.maxRounds)} / {state.maxRounds}
          </p>
        </div>
      </div>

      {state.phase === "choose" ? (
        <div className="flex flex-col items-center gap-8 mt-8">
          <Button
            className="!min-h-[100px] w-full max-w-xs font-display !text-4xl !normal-case !tracking-normal"
            onClick={() => choose("truth")}
          >
            Truth
          </Button>
          <Button
            className="!min-h-[100px] w-full max-w-xs font-display !text-4xl !normal-case !tracking-normal"
            onClick={() => choose("dare")}
          >
            Dare
          </Button>
        </div>
      ) : null}

      {state.phase === "prompt" && state.currentPrompt ? (
        <div className="mt-8 space-y-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted text-center">
            {state.currentPrompt.type}
          </p>
          <p className="font-display text-2xl sm:text-3xl text-center leading-snug min-h-[4.5rem]">
            {visible}
            <span className="opacity-0">{promptText.slice(visible.length)}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => complete(1)}>Complete ✓</Button>
            <Button variant="ghost" onClick={() => complete(0)}>
              Skip ✗
            </Button>
          </div>
        </div>
      ) : null}

      {state.phase === "gameover" ? (
        <div className="text-center mt-10 space-y-4">
          <p className="font-display text-3xl">Finished</p>
          <ScoreBoard scores={state.scores} />
          <p className="font-mono text-xs text-muted">
            {state.scores[0] === state.scores[1]
              ? "Draw"
              : state.scores[0] > state.scores[1]
                ? "Player 1 took more challenges"
                : "Player 2 took more challenges"}
          </p>
          <Button onClick={() => setState(initial)}>Play again</Button>
        </div>
      ) : null}
    </GameShell>
  );
}
