"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SessionQR } from "@/components/session/SessionQR";
import { useSession } from "@/lib/session/useSession";
import type { PlayerAction } from "@/lib/session/session.types";
import type { DrawSyncState } from "@/lib/session/drawSession";
import { encodeWordForDrawer, initialDrawSync } from "@/lib/session/drawSession";
import { redrawStrokes } from "@/lib/draw/canvasRedraw";
import { DRAW_PROMPTS } from "@/lib/utils/words";

const ROUND_MS = 60_000;

type Props = { roomCode: string };

export function DrawSessionHost({ roomCode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const secretRef = useRef("");
  const endsRef = useRef<number | null>(null);
  const pushRef = useRef<(s: unknown) => void>(() => {});
  const [sync, setSync] = useState<DrawSyncState>(initialDrawSync());
  const [started, setStarted] = useState(false);

  const onPlayerAction = useCallback((action: PlayerAction) => {
    if (action.game !== "draw") return;
    if (action.action === "STROKE") {
      setSync((prev) => {
        if (prev.status !== "draw") return prev;
        const next = {
          ...prev,
          strokes: [...prev.strokes, { points: action.points, tool: action.tool }],
        };
        pushRef.current(next);
        return next;
      });
      return;
    }
    if (action.action === "CLEAR") {
      setSync((prev) => {
        if (prev.status !== "draw") return prev;
        const next = { ...prev, strokes: [] as DrawSyncState["strokes"] };
        pushRef.current(next);
        return next;
      });
      return;
    }
    if (action.action === "GUESS") {
      const word = secretRef.current;
      setSync((prev) => {
        if (prev.status !== "guess" || !word) return prev;
        const g = action.text.trim().toLowerCase();
        const ok =
          g === word.toLowerCase() ||
          g.replace(/[-\s]/g, "") === word.toLowerCase().replace(/[-\s]/g, "");
        const next: DrawSyncState = {
          ...prev,
          status: "reveal",
          result: ok ? "win" : "time",
          revealWord: word,
          guessSubmitted: action.text,
          encWord: undefined,
        };
        pushRef.current(next);
        return next;
      });
    }
  }, []);

  const { players, gameState, connected, pushState } = useSession({
    roomCode,
    playerName: "TV",
    deviceType: "desktop",
    isHost: true,
    onPlayerAction,
  });

  pushRef.current = pushState;

  useEffect(() => {
    if (
      gameState &&
      typeof gameState === "object" &&
      (gameState as DrawSyncState).game === "draw"
    ) {
      setSync(gameState as DrawSyncState);
    }
  }, [gameState]);

  const layoutCanvas = useCallback(() => {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const rect = w.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    const ctx = c.getContext("2d");
    if (ctx) redrawStrokes(ctx, rect.width, rect.height, sync.strokes);
  }, [sync.strokes]);

  useEffect(() => {
    layoutCanvas();
  }, [layoutCanvas, sync.strokes, sync.status]);

  useEffect(() => {
    const ro = new ResizeObserver(() => layoutCanvas());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [layoutCanvas]);

  useEffect(() => {
    if (sync.status !== "draw") return;
    endsRef.current = sync.roundEndsAt;
    if (!sync.roundEndsAt) return;
    const id = window.setInterval(() => {
      const end = endsRef.current;
      if (!end) return;
      const left = Math.max(0, end - Date.now());
      setSync((prev) => {
        if (prev.status !== "draw") return prev;
        if (left <= 0) {
          endsRef.current = null;
          const next: DrawSyncState = {
            ...prev,
            status: "guess",
            timeLeft: 0,
            roundEndsAt: null,
          };
          pushRef.current(next);
          return next;
        }
        const next = { ...prev, timeLeft: left };
        if (Math.abs(prev.timeLeft - left) > 400) pushRef.current(next);
        return next;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [sync.status, sync.roundEndsAt]);

  const hasTwo =
    players.filter((p) => p.role === 1 || p.role === 2).length >= 2;

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(
      `${window.location.origin}/join/${encodeURIComponent(roomCode)}`,
    );
    u.searchParams.set("game", "drawandguess");
    return u.toString();
  }, [roomCode]);

  const startRound = () => {
    const word =
      DRAW_PROMPTS[Math.floor(Math.random() * DRAW_PROMPTS.length)]!;
    secretRef.current = word;
    const ends = Date.now() + ROUND_MS;
    endsRef.current = ends;
    const next: DrawSyncState = {
      ...initialDrawSync(),
      game: "draw",
      status: "draw",
      strokes: [],
      timeLeft: ROUND_MS,
      roundEndsAt: ends,
      encWord: encodeWordForDrawer(word),
    };
    setSync(next);
    pushState(next);
    setStarted(true);
  };

  const nextRound = () => {
    secretRef.current = "";
    const next = initialDrawSync();
    setSync(next);
    pushState(next);
    setStarted(false);
  };

  const barPct = Math.min(100, (sync.timeLeft / ROUND_MS) * 100);

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          ← Menu
        </Link>
        <h1 className="font-display text-lg text-ink">Draw & Guess · {roomCode}</h1>
        <span
          className={`font-mono text-[10px] ${connected ? "text-ink" : "text-suitred"}`}
        >
          {connected ? "Live" : "…"}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 w-full max-w-3xl mx-auto gap-6">
        {!started && sync.status === "lobby" ? (
          <div className="text-center space-y-4 w-full max-w-md flex flex-col items-center">
            {joinUrl ? <SessionQR url={joinUrl} label="Phones join here" /> : null}
            {joinUrl ? (
              <p className="font-mono text-[10px] text-dim break-all px-2">{joinUrl}</p>
            ) : null}
            <p className="font-mono text-xs text-muted">
              {players.map((p) => `${p.name} (${p.role})`).join(" · ") ||
                "Waiting…"}
            </p>
            <p className="font-mono text-[10px] text-muted">
              Prompt is random · Player 1 draws on phone · Player 2 guesses on phone
            </p>
            <Button onClick={startRound} disabled={!hasTwo || !connected}>
              Start round
            </Button>
          </div>
        ) : null}

        {(sync.status === "draw" || sync.status === "guess" || sync.status === "reveal") &&
        started ? (
          <>
            {sync.status === "draw" ? (
              <div className="w-full h-1 bg-surface-2 border border-border overflow-hidden max-w-lg">
                <div
                  className="h-full bg-white transition-[width] duration-200"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            ) : null}
            <div
              ref={wrapRef}
              className="w-full max-w-xl aspect-[4/3] border border-border bg-white"
            >
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
            <p className="font-mono text-xs text-muted text-center">
              {sync.status === "draw"
                ? "Player 1 is drawing on their phone."
                : sync.status === "guess"
                  ? "Player 2 is guessing on their phone."
                  : sync.result === "win"
                    ? "Correct!"
                    : "Reveal"}
            </p>
            {sync.status === "reveal" && sync.revealWord ? (
              <div className="text-center space-y-3">
                <p className="font-mono text-sm">Word: {sync.revealWord}</p>
                <Button onClick={nextRound}>Next round</Button>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
