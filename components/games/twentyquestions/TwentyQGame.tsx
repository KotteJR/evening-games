"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";

type Ans = "yes" | "no" | "sometimes";

type Row = { q: string; a: Ans | null };

type Phase = "entry" | "questioning" | "guessing" | "won" | "lost";

const MAX_Q = 20;

export function TwentyQGame() {
  const [phase, setPhase] = useState<Phase>("entry");
  const [secret, setSecret] = useState("");
  const [entryDraft, setEntryDraft] = useState("");
  const [questions, setQuestions] = useState<Row[]>([]);
  const [qDraft, setQDraft] = useState("");
  const [guessDraft, setGuessDraft] = useState("");

  const answered = questions.filter((r) => r.a !== null).length;
  const remaining = MAX_Q - answered;
  const awaitingAnswer =
    questions.length > 0 && questions[questions.length - 1]!.a === null;
  const showFinalGuess = answered >= 15 && phase === "questioning";

  const indicator: 1 | 2 =
    phase === "entry"
      ? 1
      : phase === "guessing"
        ? 2
        : awaitingAnswer
          ? 1
          : 2;

  const confirmSecret = () => {
    const t = entryDraft.trim();
    if (!t) return;
    setSecret(t);
    setPhase("questioning");
    setEntryDraft("");
  };

  const ask = () => {
    const q = qDraft.trim();
    if (!q || remaining <= 0 || awaitingAnswer) return;
    setQuestions((qs) => [...qs, { q, a: null }]);
    setQDraft("");
  };

  const answer = (a: Ans) => {
    setQuestions((qs) => {
      const next = [...qs];
      const last = next[next.length - 1];
      if (!last || last.a !== null) return qs;
      last.a = a;
      return next;
    });
  };

  const goGuess = () => {
    setPhase("guessing");
  };

  const submitGuess = () => {
    const g = guessDraft.trim().toLowerCase();
    if (!g) return;
    const win = g === secret.trim().toLowerCase();
    setPhase(win ? "won" : "lost");
  };

  const reset = () => {
    setPhase("entry");
    setSecret("");
    setQuestions([]);
    setQDraft("");
    setGuessDraft("");
    setEntryDraft("");
  };

  return (
    <GameShell title="Twenty Questions" currentPlayer={indicator}>
      {phase === "entry" ? (
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted uppercase tracking-[0.12em]">
            Player 1: secret thing (Player 2 looks away)
          </p>
          <input
            className="input-field"
            value={entryDraft}
            onChange={(e) => setEntryDraft(e.target.value)}
            placeholder="Person, place, object, animal…"
          />
          <Button onClick={confirmSecret}>Confirm</Button>
        </div>
      ) : null}

      {phase === "questioning" || phase === "guessing" ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="font-display text-4xl leading-none">{remaining}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mt-2">
              Questions remaining / {MAX_Q}
            </p>
          </div>

          <div className="max-h-[30vh] overflow-y-auto divide-y divide-border rounded-brand border border-border">
            {questions.length === 0 ? (
              <p className="p-4 font-mono text-xs text-dim">No questions yet.</p>
            ) : (
              questions.map((row, i) => (
                <div key={i} className="px-3 py-2">
                  <p className="font-mono text-[10px] text-dim">
                    {i + 1}. {row.q}
                  </p>
                  <p className="font-mono text-sm text-ink uppercase">
                    {row.a ?? "…"}
                  </p>
                </div>
              ))
            )}
          </div>

          {phase === "questioning" && !awaitingAnswer && remaining > 0 ? (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase text-muted tracking-[0.12em]">
                Player 2 — your question
              </p>
              <input
                className="input-field"
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Yes / no question"
              />
              <Button onClick={ask} disabled={!qDraft.trim()}>
                Ask
              </Button>
            </div>
          ) : null}

          {phase === "questioning" && awaitingAnswer ? (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase text-muted tracking-[0.12em]">
                Player 1 — answer
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => answer("yes")}>Yes</Button>
                <Button onClick={() => answer("no")}>No</Button>
                <Button onClick={() => answer("sometimes")}>Sometimes</Button>
              </div>
            </div>
          ) : null}

          {phase === "questioning" && showFinalGuess ? (
            <Button variant="ghost" onClick={goGuess}>
              Final guess
            </Button>
          ) : null}

          {phase === "guessing" ? (
            <div className="space-y-3 border-t border-border pt-6">
              <p className="font-mono text-xs text-muted">
                Player 2 — one guess for the thing
              </p>
              <input
                className="input-field"
                value={guessDraft}
                onChange={(e) => setGuessDraft(e.target.value)}
                placeholder="Your guess"
              />
              <Button onClick={submitGuess} disabled={!guessDraft.trim()}>
                Lock in guess
              </Button>
              <Button variant="ghost" onClick={() => setPhase("questioning")}>
                Back to questions
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "won" || phase === "lost" ? (
        <div className="text-center space-y-4 mt-6">
          <p className="font-display text-3xl">
            {phase === "won" ? "Player 2 wins" : "Player 1 wins"}
          </p>
          <p className="font-mono text-sm text-muted">
            Secret: <span className="text-ink">{secret}</span>
          </p>
          {phase === "lost" ? (
            <p className="font-mono text-xs text-muted">
              Guess was: {guessDraft || "—"}
            </p>
          ) : null}
          <Button onClick={reset}>Play again</Button>
        </div>
      ) : null}
    </GameShell>
  );
}
