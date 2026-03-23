"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { DRAW_PROMPTS } from "@/lib/utils/words";
import type { DrawStroke } from "@/lib/session/drawSession";
import type { DrawTool, Point } from "@/lib/session/session.types";
import { redrawStrokes } from "@/lib/draw/canvasRedraw";
import { thinPoints } from "@/lib/draw/strokeSmooth";

type Brush = "s" | "m" | "l";
const ROUND_MS = 60_000;

function randomPrompt() {
  return DRAW_PROMPTS[Math.floor(Math.random() * DRAW_PROMPTS.length)]!;
}

export function DrawGuessGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokeRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const strokeToolRef = useRef<DrawTool>({ brush: "m", eraser: false });

  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [word, setWord] = useState("");
  const [guess, setGuess] = useState("");
  const [brush, setBrush] = useState<Brush>("m");
  const [eraser, setEraser] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [status, setStatus] = useState<"lobby" | "draw" | "guess" | "reveal">(
    "lobby",
  );
  const [result, setResult] = useState<"idle" | "win" | "time">("idle");
  const [role, setRole] = useState<1 | 2>(1);

  const layoutAndDraw = useCallback(() => {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const rect = w.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    const ctx = c.getContext("2d");
    if (ctx) redrawStrokes(ctx, rect.width, rect.height, strokes);
  }, [strokes]);

  useEffect(() => {
    layoutAndDraw();
  }, [layoutAndDraw, status]);

  useEffect(() => {
    const ro = new ResizeObserver(() => layoutAndDraw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [layoutAndDraw]);

  useEffect(() => {
    if (status !== "draw") return;
    setTimeLeft(ROUND_MS);
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = ROUND_MS - (Date.now() - start);
      setTimeLeft(Math.max(0, t));
      if (t <= 0) {
        window.clearInterval(id);
        setStatus("guess");
        setResult("time");
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [status]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startRound = () => {
    setWord(randomPrompt());
    setGuess("");
    setResult("idle");
    setStrokes([]);
    setStatus("draw");
    window.requestAnimationFrame(layoutAndDraw);
  };

  const clearCanvas = () => setStrokes([]);

  const checkGuess = () => {
    if (!guess.trim()) return;
    const ok =
      guess.trim().toLowerCase() === word.toLowerCase() ||
      guess.trim().toLowerCase().replace(/[-\s]/g, "") ===
        word.toLowerCase().replace(/[-\s]/g, "");
    if (ok) setResult("win");
    setStatus("reveal");
  };

  const swap = () => {
    setRole((r) => (r === 1 ? 2 : 1));
    setStatus("lobby");
    setResult("idle");
    setGuess("");
    setStrokes([]);
  };

  const barPct = useMemo(
    () => Math.max(0, Math.min(100, (timeLeft / ROUND_MS) * 100)),
    [timeLeft],
  );

  const indicator: 1 | 2 =
    status === "draw" ? 1 : status === "guess" ? 2 : role;

  return (
    <GameShell title="Draw & Guess" currentPlayer={indicator}>
      {status === "lobby" ? (
        <div className="space-y-4 text-center w-full max-w-md mx-auto">
          <p className="font-mono text-xs text-muted">
            Player 1 draws · Player 2 guesses (swap each round)
          </p>
          <Button onClick={startRound}>Start round</Button>
        </div>
      ) : null}

      {status === "draw" ? (
        <div className="space-y-4 w-full max-w-lg mx-auto flex flex-col items-center">
          <p className="font-display text-xl text-center">{word}</p>
          <p className="font-mono text-[10px] text-center text-muted uppercase tracking-[0.14em]">
            Only Player 1 should see the word
          </p>
          <div className="h-1 w-full bg-surface-2 border border-border overflow-hidden max-w-lg">
            <div
              className="h-full bg-white transition-[width] duration-200"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {(["s", "m", "l"] as const).map((b) => (
              <Button
                key={b}
                variant={brush === b && !eraser ? "primary" : "ghost"}
                className="!min-h-10"
                onClick={() => {
                  setBrush(b);
                  setEraser(false);
                }}
              >
                {b.toUpperCase()}
              </Button>
            ))}
            <Button
              variant={eraser ? "primary" : "ghost"}
              className="!min-h-10"
              onClick={() => setEraser(true)}
            >
              Eraser
            </Button>
            <Button variant="ghost" className="!min-h-10" onClick={clearCanvas}>
              Clear
            </Button>
          </div>
          <div
            ref={wrapRef}
            className="w-full aspect-[4/3] touch-none border border-border bg-white max-w-lg"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                strokeToolRef.current = { brush, eraser };
                e.currentTarget.setPointerCapture(e.pointerId);
                drawingRef.current = true;
                strokeRef.current = [pos(e)];
              }}
              onPointerUp={(e) => {
                drawingRef.current = false;
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
                const pts = thinPoints(strokeRef.current, 2);
                strokeRef.current = [];
                if (pts.length >= 2) {
                  setStrokes((s) => [
                    ...s,
                    { points: pts, tool: { ...strokeToolRef.current } },
                  ]);
                }
              }}
              onPointerCancel={() => {
                drawingRef.current = false;
                strokeRef.current = [];
              }}
              onPointerMove={(e) => {
                if (!drawingRef.current) return;
                strokeRef.current.push(pos(e));
              }}
            />
          </div>
        </div>
      ) : null}

      {status === "guess" || status === "reveal" ? (
        <div className="space-y-6 w-full max-w-md mx-auto flex flex-col items-center text-center">
          {status === "guess" ? (
            <>
              <p className="font-mono text-xs text-muted">
                Player 2 — what is it?
              </p>
              <div
                ref={wrapRef}
                className="w-full aspect-[4/3] border border-border bg-white"
              >
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
              <input
                className="input-field"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Your guess"
              />
              <Button onClick={checkGuess} disabled={!guess.trim()}>
                Submit guess
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="font-display text-2xl animate-pulse-win">
                {result === "win" ? "Correct!" : "Time’s up — reveal"}
              </p>
              <p className="font-mono text-sm text-muted">Word: {word}</p>
              <Button onClick={swap}>Swap roles & play again</Button>
            </div>
          )}
        </div>
      ) : null}
    </GameShell>
  );
}
