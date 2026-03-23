"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session/useSession";
import { getDeviceType } from "@/lib/session/deviceType";
import type { PlayerAction } from "@/lib/session/session.types";
import {
  BS_SIZE,
  SHIP_LENGTHS,
  placeShip,
  type Cell,
  type Grid,
} from "@/lib/games/battleship";
import type {
  BattleshipPublicState,
  FogCell,
} from "@/lib/session/battleshipSessionReducer";

type Props = { roomCode: string; playerName: string };

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.map((c) => ({ ...c })));
}

function parseBsSync(raw: unknown): {
  public: BattleshipPublicState;
  myGrid: Grid;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 2 || o.game !== "battleship") return null;
  const pub = o.public as BattleshipPublicState;
  if (!pub || pub.game !== "battleship") return null;
  const you = o.you as { myGrid?: Grid } | undefined;
  if (!you?.myGrid) return null;
  return { public: pub, myGrid: you.myGrid };
}

export function BattleshipSessionPhone({ roomCode, playerName }: Props) {
  const { gameState, connected, myRole, sendAction, error, connectionHint } =
    useSession({
    roomCode,
    playerName,
    deviceType: getDeviceType(),
    isHost: false,
  });

  const view = useMemo(() => parseBsSync(gameState), [gameState]);
  const pub = view?.public;
  const myGrid = view?.myGrid;
  const role = myRole === 1 || myRole === 2 ? myRole : null;
  const idx = role ? role - 1 : 0;

  const nextShip = pub?.placement.nextShip[idx] ?? null;
  const horizontal = pub?.placement.horizontal[idx] ?? true;

  const sendPlace = (r: number, c: number) => {
    if (!role || !pub || !myGrid || !nextShip) return;
    const g = cloneGrid(myGrid);
    const placed = placeShip(g, nextShip, r, c, horizontal);
    if (!placed) return;
    sendAction({
      game: "battleship",
      action: "PLACE_SHIP",
      ship: placed,
      player: role,
      horizontal,
    } satisfies PlayerAction);
  };

  const toggleOrientation = () => {
    if (!role) return;
    sendAction({
      game: "battleship",
      action: "TOGGLE_ORIENTATION",
      player: role,
    });
  };

  const readyFleet = () => {
    if (!role) return;
    sendAction({
      game: "battleship",
      action: "READY_FLEET",
      player: role,
    });
  };

  const fireAt = (r: number, c: number) => {
    if (!role) return;
    sendAction({
      game: "battleship",
      action: "FIRE",
      x: r,
      y: c,
      player: role,
    });
  };

  const renderMyGrid = (
    g: Grid,
    onCell: (r: number, c: number) => void,
    showShips: boolean,
  ) => (
    <div
      className="mx-auto grid w-full max-w-[300px] gap-0 overflow-hidden rounded-brand border border-border"
      style={{
        gridTemplateColumns: `repeat(${BS_SIZE}, minmax(0,1fr))`,
      }}
    >
      {g.map((row, r) =>
        row.map((cell: Cell, c) => (
          <button
            key={`${r}-${c}`}
            type="button"
            onClick={() => onCell(r, c)}
            className={`aspect-square border border-border text-[10px] font-mono ${
              cell.hit
                ? cell.ship
                  ? "text-suitred"
                  : "text-muted"
                : showShips && cell.ship
                  ? "bg-card text-neutral-900"
                  : "bg-surface"
            }`}
          >
            {cell.hit ? (cell.ship ? "✕" : "·") : ""}
          </button>
        )),
      )}
    </div>
  );

  const renderFogTarget = (fog: FogCell[][], canFire: boolean) => (
    <div
      className="mx-auto grid w-full max-w-[300px] gap-0 overflow-hidden rounded-brand border border-border"
      style={{
        gridTemplateColumns: `repeat(${BS_SIZE}, minmax(0,1fr))`,
      }}
    >
      {fog.map((row, r) =>
        row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            type="button"
            disabled={cell !== "e" || !canFire}
            onClick={() => fireAt(r, c)}
            className={`aspect-square border border-border text-[10px] font-mono ${
              cell === "h"
                ? "text-suitred"
                : cell === "m"
                  ? "text-muted"
                  : "bg-surface"
            } ${cell === "e" ? "cursor-pointer" : "cursor-default"}`}
          >
            {cell === "h" ? "✕" : cell === "m" ? "·" : ""}
          </button>
        )),
      )}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
        <p className="font-mono text-sm text-suitred text-center">{error}</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-3 max-w-md mx-auto w-full">
        {connectionHint ? (
          <p className="font-mono text-xs text-suitred text-center leading-relaxed">
            {connectionHint}
          </p>
        ) : null}
        <p className="font-mono text-sm text-muted text-center">
          {connected ? "Assigning seat…" : "Connecting…"}
        </p>
      </div>
    );
  }

  if (!pub || !myGrid || pub.phase === "lobby") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-4">
        <p className="font-display text-2xl text-ink">Player {role}</p>
        <p className="font-mono text-sm text-muted text-center">
          {connected ? "Waiting for host…" : "Connecting…"}
        </p>
      </div>
    );
  }

  const enemyIdx = role === 1 ? 1 : 0;
  const targetFog = pub.fog[enemyIdx]!;
  const myTurnCombat = pub.phase === "combat" && pub.current === role;

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col px-4 py-6 max-w-phone mx-auto w-full gap-4">
      <header className="flex justify-between">
        <div>
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.15em]">
            Battleship · P{role}
          </p>
          <p className="font-mono text-[10px] text-dim">{connected ? "Live" : "…"}</p>
        </div>
      </header>

      <p className="font-mono text-xs text-center text-muted">{pub.lastMsg}</p>

      {pub.phase === "placement" ? (
        <div className="space-y-4">
          <p className="font-mono text-[10px] text-muted text-center">
            Place {nextShip ?? "fleet"} ·{" "}
            <button
              type="button"
              className="underline"
              onClick={toggleOrientation}
            >
              {horizontal ? "Horizontal" : "Vertical"}
            </button>
          </p>
          {nextShip ? (
            <p className="font-mono text-[10px] text-dim text-center">
              Tap the top/left cell of the ship ({SHIP_LENGTHS[nextShip]} cells)
            </p>
          ) : null}
          {renderMyGrid(myGrid, sendPlace, true)}
          <Button
            onClick={readyFleet}
            disabled={
              pub.placement.shipsPlaced[idx] < 5 || pub.placement.ready[idx]
            }
          >
            Fleet ready
          </Button>
          <p className="font-mono text-[9px] text-dim text-center">
            Ready only when all 5 ships are placed.
          </p>
        </div>
      ) : null}

      {pub.phase === "combat" || pub.phase === "over" ? (
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[10px] text-muted mb-1">My fleet</p>
            {renderMyGrid(myGrid, () => {}, true)}
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted mb-1">
              Enemy waters
              {myTurnCombat && pub.phase === "combat"
                ? " — tap to fire"
                : " — wait"}
            </p>
            {renderFogTarget(
              targetFog,
              myTurnCombat && pub.phase === "combat",
            )}
          </div>
          {pub.phase === "over" ? (
            <p className="font-display text-xl text-center">
              {pub.winner === role ? "You win!" : "Check the TV"}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
