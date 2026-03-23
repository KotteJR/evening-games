"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { HangmanFigure } from "@/components/games/hangman/HangmanFigure";
import { HangmanState, isWin, maskWord, normalizeWord } from "@/lib/games/hangman";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function initialState(): HangmanState {
  return {
    phase: "entry",
    word: "",
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrong: 6,
    currentPlayer: 1,
  };
}

export function HangmanGame() {
  const [state, setState] = useState<HangmanState>(initialState);
  const [entryDraft, setEntryDraft] = useState("");

  const guessed = useMemo(
    () => new Set(state.guessedLetters),
    [state.guessedLetters],
  );

  const onConfirmWord = () => {
    const w = normalizeWord(entryDraft);
    if (!w.replace(/ /g, "")) return;
    setState((s) => ({
      ...s,
      phase: "guessing",
      word: w,
      guessedLetters: [],
      wrongGuesses: 0,
    }));
    setEntryDraft("");
  };

  const onLetter = (L: string) => {
    if (state.phase !== "guessing") return;
    if (guessed.has(L)) return;
    const inWord = state.word.includes(L);
    setState((s) => {
      const nextGuessed = [...s.guessedLetters, L];
      const g = new Set(nextGuessed);
      const wrong = inWord ? s.wrongGuesses : s.wrongGuesses + 1;
      let phase = s.phase;
      if (!inWord && wrong >= s.maxWrong) phase = "lost";
      else if (isWin(s.word, g)) phase = "won";
      return {
        ...s,
        guessedLetters: nextGuessed,
        wrongGuesses: wrong,
        phase,
      };
    });
  };

  const rematch = () => {
    setState((s) => ({
      ...initialState(),
      currentPlayer: s.currentPlayer === 1 ? 2 : 1,
      phase: "entry",
    }));
  };

  const cp: 1 | 2 =
    state.phase === "entry"
      ? state.currentPlayer
      : state.phase === "guessing"
        ? 2
        : state.currentPlayer === 1
          ? 2
          : 1;

  return (
    <GameShell title="Hangman" currentPlayer={cp}>
      {state.phase === "entry" ? (
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted uppercase tracking-[0.12em]">
            Player {state.currentPlayer}: set a word (Player 2 looks away)
          </p>
          <input
            type="password"
            autoComplete="off"
            value={entryDraft}
            onChange={(e) => setEntryDraft(e.target.value)}
            placeholder="Secret word or phrase"
            className="input-field"
          />
          <Button onClick={onConfirmWord} disabled={!entryDraft.trim()}>
            Confirm word
          </Button>
        </div>
      ) : null}

      {state.phase === "guessing" || state.phase === "won" || state.phase === "lost" ? (
        <div className="space-y-6">
          <p className="font-display text-2xl tracking-[0.2em] text-center break-all">
            {maskWord(state.word, guessed)
              .split("")
              .map((ch, i) => (
                <span key={i} className="inline-block min-w-[0.6em] text-center">
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
          </p>
          <div className="w-full max-w-[320px] mx-auto">
            <HangmanFigure wrong={state.wrongGuesses} />
          </div>
          <p className="font-mono text-center text-xs uppercase tracking-[0.14em]">
            Wrong: {state.wrongGuesses} / {state.maxWrong}
          </p>
          <div
            className="grid grid-cols-6 gap-2 sm:grid-cols-9"
            role="group"
            aria-label="Letter keyboard"
          >
            {LETTERS.map((L) => {
              const used = guessed.has(L);
              const correct = used && state.word.includes(L);
              return (
                <button
                  key={L}
                  type="button"
                  disabled={used || state.phase !== "guessing"}
                  onClick={() => onLetter(L)}
                  className={`min-h-12 rounded-brand font-mono text-sm border ${
                    !used
                      ? "border-border text-ink hover:border-border-strong"
                      : correct
                        ? "border-border-strong text-ink"
                        : "border-border text-dim line-through"
                  }`}
                >
                  {L}
                </button>
              );
            })}
          </div>
          {state.phase === "won" ? (
            <div className="text-center space-y-4 animate-pulse-win">
              <p className="font-display text-2xl">Player 2 wins!</p>
              <p className="font-mono text-xs text-muted">Word: {state.word}</p>
              <Button onClick={rematch}>Rematch</Button>
            </div>
          ) : null}
          {state.phase === "lost" ? (
            <div className="text-center space-y-4">
              <p className="font-display text-2xl">Player 1 holds the word</p>
              <p className="font-mono text-xs text-muted">Word: {state.word}</p>
              <Button onClick={rematch}>Rematch</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </GameShell>
  );
}
