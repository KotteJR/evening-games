"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";

type Mode = "classic" | "five" | "super";

type P = 1 | 2;

const LINES_3 = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function check3(cells: (P | null)[]): P | "draw" | null {
  for (const [a, b, c] of LINES_3) {
    const x = cells[a];
    if (x && x === cells[b] && x === cells[c]) return x;
  }
  if (cells.every((v) => v !== null)) return "draw";
  return null;
}

function check5(board: (P | null)[], need = 4): P | "draw" | null {
  const s = 5;
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      const idx = r * s + c;
      const base = board[idx];
      if (!base) continue;
      const dirs = [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ] as const;
      for (const [dr, dc] of dirs) {
        let cnt = 1;
        for (let k = 1; k < need; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || cc < 0 || rr >= s || cc >= s) break;
          if (board[rr * s + cc] === base) cnt++;
          else break;
        }
        if (cnt >= need) return base;
      }
    }
  }
  if (board.every((v) => v !== null)) return "draw";
  return null;
}

function empty9<T>(v: T): T[] {
  return Array(9).fill(v);
}

function SuperBoard() {
  const [inners, setInners] = useState(() =>
    Array.from({ length: 9 }, () => empty9<P | null>(null)),
  );
  const [meta, setMeta] = useState<(P | "cat" | null)[]>(() => empty9(null));
  const [nextOuter, setNextOuter] = useState<number | null>(null);
  const [cur, setCur] = useState<P>(1);
  const [winner, setWinner] = useState<P | "draw" | null>(null);
  const [last, setLast] = useState<{ o: number; i: number } | null>(null);

  const metaDone = (m: (P | "cat" | null)[], o: number) => m[o] !== null;

  const playInner = (o: number, i: number) => {
    if (winner) return;
    if (nextOuter !== null && o !== nextOuter && !metaDone(meta, nextOuter))
      return;
    if (metaDone(meta, o)) return;
    const b = [...inners[o]!];
    if (b[i]) return;
    b[i] = cur;
    const inners2 = [...inners];
    inners2[o] = b;
    setInners(inners2);

    const iw = check3(b);
    const meta2 = [...meta];
    if (iw === "draw") meta2[o] = "cat";
    else if (iw) meta2[o] = iw;
    setMeta(meta2);

    const metaLine = meta2.map((m) => (m === 1 || m === 2 ? m : null));
    const mw = check3(metaLine);
    if (mw && mw !== "draw") {
      setWinner(mw);
      setLast({ o, i });
      return;
    }
    if (meta2.every((x) => x !== null)) {
      setWinner("draw");
      setLast({ o, i });
      return;
    }

    const forced = i;
    setNextOuter(metaDone(meta2, forced) ? null : forced);
    setLast({ o, i });
    setCur(cur === 1 ? 2 : 1);
  };

  const reset = () => {
    setInners(Array.from({ length: 9 }, () => empty9<P | null>(null)));
    setMeta(empty9(null));
    setNextOuter(null);
    setCur(1);
    setWinner(null);
    setLast(null);
  };

  const sym = (p: P) => (p === 1 ? "○" : "✕");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 max-w-[min(100%,360px)] mx-auto">
        {inners.map((board, o) => (
          <div
            key={o}
            className={`grid grid-cols-3 border border-border ${
              nextOuter === o ? "ring-1 ring-white" : ""
            } ${metaDone(meta, o) ? "opacity-60" : ""}`}
          >
            {board.map((cell, i) => (
              <button
                key={i}
                type="button"
                disabled={!!winner || !!cell || metaDone(meta, o)}
                onClick={() => playInner(o, i)}
                className="aspect-square border border-border font-display text-lg flex items-center justify-center hover:bg-white/5"
              >
                {cell ? sym(cell) : ""}
                {last && last.o === o && last.i === i ? (
                  <span className="sr-only">last move</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>
      {last ? (
        <p className="font-mono text-[10px] text-center text-dim">
          Last: outer {last.o + 1} · cell {last.i + 1}
        </p>
      ) : null}
      {winner ? (
        <div className="text-center space-y-3">
          <p className="font-display text-2xl">
            {winner === "draw" ? "Draw" : `${sym(winner)} wins`}
          </p>
          <Button onClick={reset}>Again</Button>
        </div>
      ) : null}
      <Button variant="ghost" onClick={reset}>
        Reset board
      </Button>
    </div>
  );
}

function LineBoard({
  size,
  need,
  title,
}: {
  size: 3 | 5;
  need: number;
  title: string;
}) {
  const len = size * size;
  const [cells, setCells] = useState<(P | null)[]>(() => Array(len).fill(null));
  const [cur, setCur] = useState<P>(1);
  const [win, setWin] = useState<P | "draw" | null>(null);
  const [last, setLast] = useState<number | null>(null);

  const sym = (p: P) => (p === 1 ? "○" : "✕");

  const click = (i: number) => {
    if (win || cells[i]) return;
    const next = [...cells];
    next[i] = cur;
    setCells(next);
    setLast(i);
    const w = size === 3 ? check3(next) : check5(next, need);
    if (w) setWin(w);
    else setCur(cur === 1 ? 2 : 1);
  };

  const reset = () => {
    setCells(Array(len).fill(null));
    setCur(1);
    setWin(null);
    setLast(null);
  };

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] text-muted text-center">{title}</p>
      <div
        className="grid gap-0 mx-auto border border-border w-full max-w-[min(100%,320px)]"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))` }}
      >
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={!!win || !!c}
            onClick={() => click(i)}
            className="aspect-square border border-border font-display text-xl sm:text-2xl flex items-center justify-center hover:bg-white/5 relative"
          >
            {c ? sym(c) : ""}
            {last === i ? (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
            ) : null}
          </button>
        ))}
      </div>
      {win ? (
        <div className="text-center space-y-3">
          <p className="font-display text-2xl">
            {win === "draw" ? "Draw" : `${sym(win)} wins`}
          </p>
          <Button onClick={reset}>Again</Button>
        </div>
      ) : null}
      <Button variant="ghost" onClick={reset}>
        Reset
      </Button>
    </div>
  );
}

export function NoughtsGame() {
  const [mode, setMode] = useState<Mode | null>(null);

  if (!mode) {
    return (
      <GameShell title="Noughts & Crosses" currentPlayer={1}>
        <p className="font-mono text-xs text-muted mb-4">
          ○ is Player 1 · ✕ is Player 2
        </p>
        <div className="grid gap-2">
          <Button onClick={() => setMode("classic")}>Classic 3×3</Button>
          <Button onClick={() => setMode("five")}>Ultimate 5×5 (4 in a row)</Button>
          <Button onClick={() => setMode("super")}>Super (meta 3×3)</Button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Noughts & Crosses" currentPlayer={1}>
      <Button variant="ghost" className="mb-4" onClick={() => setMode(null)}>
        ← Modes
      </Button>
      {mode === "classic" ? (
        <LineBoard size={3} need={3} title="First with three in a row wins." />
      ) : null}
      {mode === "five" ? (
        <LineBoard size={5} need={4} title="First with four in a row wins." />
      ) : null}
      {mode === "super" ? <SuperBoard /> : null}
    </GameShell>
  );
}
