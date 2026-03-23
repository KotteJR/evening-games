"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import type { WordChainCategory } from "@/lib/games/wordchain";
import {
  lastLetter,
  normalizeChainWord,
  validateMove,
} from "@/lib/games/wordchain";
import {
  WORD_CHAIN_ANIMALS,
  WORD_CHAIN_COUNTRIES,
  WORD_CHAIN_FOODS,
} from "@/lib/utils/words";

const TURN_MS = 10_000;
const TICK = 200;

function buildSet(cat: WordChainCategory): Set<string> | null {
  if (cat === "free") return null;
  const list =
    cat === "animals"
      ? WORD_CHAIN_ANIMALS
      : cat === "countries"
        ? WORD_CHAIN_COUNTRIES
        : WORD_CHAIN_FOODS;
  return new Set(list.map((w) => normalizeChainWord(w)));
}

export function WordChainGame() {
  const [category, setCategory] = useState<WordChainCategory | null>(null);
  const [chain, setChain] = useState<string[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [timeLeft, setTimeLeft] = useState(TURN_MS);
  const [status, setStatus] = useState<"playing" | "gameover">("playing");
  const [loser, setLoser] = useState<1 | 2 | null>(null);
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const playerRef = useRef(currentPlayer);
  playerRef.current = currentPlayer;

  const allowed = useMemo(
    () => (category ? buildSet(category) : null),
    [category],
  );

  useEffect(() => {
    if (!category || status !== "playing") return;
    setTimeLeft(TURN_MS);
  }, [category, currentPlayer, chain, status]);

  useEffect(() => {
    if (!category || status !== "playing") return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= TICK) {
          window.clearInterval(id);
          setStatus("gameover");
          setLoser(playerRef.current);
          return 0;
        }
        return t - TICK;
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [category, currentPlayer, chain, status]);

  const start = (c: WordChainCategory) => {
    setCategory(c);
    setChain([]);
    setUsed([]);
    setCurrentPlayer(1);
    setStatus("playing");
    setLoser(null);
    setInput("");
    setErr(null);
    setTimeLeft(TURN_MS);
  };

  const submit = () => {
    if (status !== "playing" || !category) return;
    const usedSet = new Set(used);
    const v = validateMove(input, chain, usedSet, allowed);
    if (!v.ok) {
      setErr(v.reason);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 400);
      setStatus("gameover");
      setLoser(currentPlayer);
      return;
    }
    const n = normalizeChainWord(input);
    const key = n.replace(/\s/g, "");
    setUsed((u) => [...u, n, key]);
    setChain((c) => [n, ...c]);
    setInput("");
    setErr(null);
    setCurrentPlayer((p) => (p === 1 ? 2 : 1));
  };

  const barPct = Math.max(0, Math.min(100, (timeLeft / TURN_MS) * 100));

  if (!category) {
    return (
      <GameShell title="Word Chain" currentPlayer={1}>
        <p className="font-mono text-xs text-muted mb-4 uppercase tracking-[0.12em]">
          Pick a category to begin
        </p>
        <div className="grid gap-2">
          {(
            [
              ["animals", "Animals"],
              ["countries", "Countries"],
              ["foods", "Foods"],
              ["free", "Free for all"],
            ] as const
          ).map(([id, label]) => (
            <Button key={id} onClick={() => start(id)}>
              {label}
            </Button>
          ))}
        </div>
      </GameShell>
    );
  }

  const need = chain.length ? lastLetter(chain[0]!) : null;

  return (
    <GameShell title="Word Chain" currentPlayer={currentPlayer}>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full border border-border bg-surface-2">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-200 ease-linear"
          style={{ width: `${barPct}%` }}
        />
      </div>
      {need ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-2">
          Next word must start with{" "}
          <span className="text-ink">{need.toUpperCase()}</span>
        </p>
      ) : (
        <p className="font-mono text-[10px] text-muted mb-2 uppercase tracking-[0.14em]">
          Any word to open the chain
        </p>
      )}
      <div className="mb-4 max-h-[40vh] divide-y divide-border overflow-y-auto rounded-brand border border-border">
        {chain.length === 0 ? (
          <p className="p-4 font-mono text-xs text-dim">No words yet.</p>
        ) : (
          chain.map((w, i) => (
            <div key={`${w}-${i}`} className="px-3 py-2 font-mono text-sm text-ink">
              {w}
            </div>
          ))
        )}
      </div>
      {status === "playing" ? (
        <div className="space-y-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Your word"
            aria-invalid={!!err}
            className={`input-field ${
              flash ? "border-suitred" : ""
            }`}
          />
          {err ? (
            <p className="font-mono text-xs text-suitred" role="alert">
              {err}
            </p>
          ) : null}
          <Button onClick={submit} disabled={!input.trim()}>
            Submit
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <p className="font-display text-2xl">Game over</p>
          <p className="font-mono text-sm text-muted">
            Player {loser} slipped — Player {loser === 1 ? 2 : 1} wins
          </p>
          <Button
            onClick={() => {
              setCategory(null);
            }}
          >
            New category
          </Button>
        </div>
      )}
    </GameShell>
  );
}
