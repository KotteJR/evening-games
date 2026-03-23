"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session/useSession";
import type { DrawTool, PlayerAction, Point } from "@/lib/session/session.types";
import type { DrawSyncState } from "@/lib/session/drawSession";
import { decodeDrawerWord } from "@/lib/session/drawSession";
import { redrawStrokes } from "@/lib/draw/canvasRedraw";
import { thinPoints } from "@/lib/draw/strokeSmooth";

type Brush = "s" | "m" | "l";

type Props = { roomCode: string; playerName: string };

export function DrawSessionPhone({ roomCode, playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokeRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const strokeToolRef = useRef<DrawTool>({ brush: "m", eraser: false });

  const [brush, setBrush] = useState<Brush>("m");
  const [eraser, setEraser] = useState(false);
  const { gameState, connected, myRole, sendAction, error, connectionHint } =
    useSession({
      roomCode,
      playerName,
      deviceType: "phone",
      isHost: false,
    });

  const sync = gameState as DrawSyncState | null;
  const s =
    sync && typeof sync === "object" && sync.game === "draw" ? sync : null;

  const layoutAndDraw = useCallback(() => {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w || !s) return;
    const rect = w.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    const ctx = c.getContext("2d");
    if (ctx) redrawStrokes(ctx, rect.width, rect.height, s.strokes);
  }, [s]);

  useEffect(() => {
    layoutAndDraw();
  }, [layoutAndDraw, s?.strokes]);

  useEffect(() => {
    const ro = new ResizeObserver(() => layoutAndDraw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [layoutAndDraw]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  if (!connected || myRole === null) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-4 max-w-md mx-auto w-full">
        {error ? (
          <p className="font-mono text-sm text-suitred text-center">{error}</p>
        ) : null}
        {connectionHint ? (
          <p className="font-mono text-xs text-suitred text-center leading-relaxed">
            {connectionHint}
          </p>
        ) : null}
        <p className="font-mono text-sm text-muted text-center">Connecting…</p>
      </div>
    );
  }

  if (myRole === "host") {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4 text-center">
        <p className="font-mono text-sm text-muted">Use the laptop / TV host view.</p>
      </div>
    );
  }

  const word =
    s?.encWord && myRole === 1 ? decodeDrawerWord(s.encWord) : "";

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col px-3 py-6 max-w-phone mx-auto w-full">
      <header className="text-center mb-4">
        <p className="font-mono text-[10px] text-muted">{roomCode}</p>
        <p className="font-display text-lg mt-1">
          {myRole === 1 ? "Draw" : "Guess"}
        </p>
      </header>

      {!s || s.status === "lobby" ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-muted text-center">
            Waiting for host…
          </p>
        </div>
      ) : null}

      {s && s.status === "draw" && myRole === 1 ? (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {word ? (
            <p className="font-display text-xl text-center">{word}</p>
          ) : null}
          <p className="font-mono text-[10px] text-center text-muted uppercase">
            Draw on the canvas — strokes appear on TV live
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {(["s", "m", "l"] as const).map((b) => (
              <Button
                key={b}
                variant={brush === b && !eraser ? "primary" : "ghost"}
                className="!min-h-10 !px-3"
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
            <Button
              variant="ghost"
              className="!min-h-10"
              onClick={() => sendAction({ game: "draw", action: "CLEAR" })}
            >
              Clear
            </Button>
          </div>
          <div
            ref={wrapRef}
            className="flex-1 min-h-[200px] w-full border border-border bg-white touch-none rounded-brand"
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
                  sendAction({
                    game: "draw",
                    action: "STROKE",
                    points: pts,
                    tool: { ...strokeToolRef.current },
                  });
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

      {s && s.status === "draw" && myRole === 2 ? (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <p className="font-mono text-sm text-muted text-center">
            Watch the TV — drawing in progress.
          </p>
          <div
            ref={wrapRef}
            className="flex-1 min-h-[200px] w-full border border-border bg-white rounded-brand"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>
      ) : null}

      {s && s.status === "guess" && myRole === 2 ? (
        <div className="flex-1 flex flex-col justify-center gap-4 w-full">
          <div
            ref={wrapRef}
            className="w-full aspect-[4/3] border border-border bg-white rounded-brand mb-4"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <GuessPanel sendAction={sendAction} />
        </div>
      ) : null}

      {s && s.status === "guess" && myRole === 1 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-muted text-center">
            Player 2 is guessing.
          </p>
        </div>
      ) : null}

      {s && s.status === "reveal" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
          <p className="font-display text-2xl">
            {s.result === "win" ? "Nailed it" : "Nice try"}
          </p>
          {s.revealWord ? (
            <p className="font-mono text-sm text-muted">{s.revealWord}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GuessPanel({ sendAction }: { sendAction: (a: PlayerAction) => void }) {
  const [g, setG] = useState("");
  return (
    <>
      <input
        value={g}
        onChange={(e) => setG(e.target.value)}
        placeholder="Your guess"
        className="input-field"
      />
      <Button
        onClick={() => {
          if (!g.trim()) return;
          sendAction({ game: "draw", action: "GUESS", text: g.trim() });
        }}
        disabled={!g.trim()}
      >
        Submit guess
      </Button>
    </>
  );
}
