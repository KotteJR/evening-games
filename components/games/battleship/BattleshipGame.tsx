"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import {
  BS_SIZE,
  SHIP_ORDER,
  SHIP_LENGTHS,
  allShipsPlaced,
  emptyGrid,
  fire,
  placeShip,
  type Cell,
  type Grid,
  type PlacedShip,
  type ShipName,
} from "@/lib/games/battleship";

type Phase = "p1" | "p2" | "combat" | "over";

type St = {
  phase: Phase;
  grids: [Grid, Grid];
  ships: [PlacedShip[], PlacedShip[]];
  horizontal: boolean;
  activeShip: ShipName | null;
  current: 1 | 2;
  lastMsg: string;
  winner: 1 | 2 | null;
};

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.map((c) => ({ ...c })));
}

const initial: St = {
  phase: "p1",
  grids: [emptyGrid(), emptyGrid()],
  ships: [[], []],
  horizontal: true,
  activeShip: "Carrier",
  current: 1,
  lastMsg: "",
  winner: null,
};

export function BattleshipGame() {
  const [s, setS] = useState<St>(initial);

  const indicator: 1 | 2 =
    s.phase === "p1" || s.phase === "p2"
      ? s.phase === "p1"
        ? 1
        : 2
      : s.current;

  const placeClick = (r: number, c: number) => {
    setS((x) => {
      if (x.phase !== "p1" && x.phase !== "p2") return x;
      const p = x.phase === "p1" ? 0 : 1;
      const name = x.activeShip;
      if (!name) return x;
      const grid = cloneGrid(x.grids[p]!);
      const placed = placeShip(grid, name, r, c, x.horizontal);
      if (!placed) return x;
      const ships = [...x.ships[p]!];
      ships.push(placed);
      const grids: [Grid, Grid] = [...x.grids];
      grids[p] = grid;
      const nextShip = SHIP_ORDER[ships.length] ?? null;
      return {
        ...x,
        grids,
        ships: p === 0 ? [ships, x.ships[1]] : [x.ships[0], ships],
        activeShip: nextShip,
      };
    });
  };

  const ready = () => {
    setS((x) => {
      const p = x.phase === "p1" ? 0 : 1;
      if (!allShipsPlaced(x.ships[p]!)) return x;
      if (x.phase === "p1") {
        return {
          ...x,
          phase: "p2",
          activeShip: "Carrier",
          horizontal: true,
        };
      }
      return {
        ...x,
        phase: "combat",
        current: 1,
        lastMsg: "Combat — P1 fires",
      };
    });
  };

  const combatClick = (r: number, c: number) => {
    setS((prev) => {
      if (prev.phase !== "combat") return prev;
      const attacker = prev.current;
      const enemyIdx = attacker === 1 ? 1 : 0;
      const enemyGrid = cloneGrid(prev.grids[enemyIdx]!);
      const cell = enemyGrid[r]![c]!;
      if (cell.hit) return prev;
      const { hit, sunk } = fire(enemyGrid, r, c);
      const grids: [Grid, Grid] = [...prev.grids];
      grids[enemyIdx] = enemyGrid;

      let msg = hit ? "HIT!" : "MISS";
      if (sunk) msg = `SUNK — ${sunk}`;

      const allHit = enemyGrid
        .flat()
        .every((cl) => cl.ship === null || cl.hit);
      return {
        ...prev,
        grids,
        lastMsg: msg,
        current: attacker === 1 ? 2 : 1,
        phase: allHit ? "over" : "combat",
        winner: allHit ? attacker : null,
      };
    });
  };

  const renderGrid = (
    g: Grid,
    showShips: boolean,
    onCell: (r: number, c: number) => void,
  ) => (
    <div
      className="grid gap-0 border border-border mx-auto w-full max-w-[340px]"
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
                  ? "text-white"
                  : "text-muted"
                : showShips && cell.ship
                  ? "bg-white text-black"
                  : "bg-black"
            }`}
          >
            {cell.hit ? (cell.ship ? "✕" : "·") : ""}
          </button>
        )),
      )}
    </div>
  );

  return (
    <GameShell title="Battleship" currentPlayer={indicator}>
      {s.phase === "p1" || s.phase === "p2" ? (
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted">
            {s.phase === "p1" ? "Player 1" : "Player 2"} — place{" "}
            {s.activeShip ?? "fleet"} ({SHIP_LENGTHS[s.activeShip ?? "Destroyer"]}{" "}
            cells) ·{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setS((x) => ({ ...x, horizontal: !x.horizontal }))}
            >
              {s.horizontal ? "Horizontal" : "Vertical"}
            </button>
          </p>
          {renderGrid(s.grids[s.phase === "p1" ? 0 : 1]!, true, placeClick)}
          <Button onClick={ready} disabled={!allShipsPlaced(s.ships[s.phase === "p1" ? 0 : 1]!)}>
            Ready
          </Button>
        </div>
      ) : null}

      {s.phase === "combat" || s.phase === "over" ? (
        <div className="space-y-6">
          <p
            className="font-mono text-center text-sm uppercase tracking-[0.14em]"
            role="status"
          >
            {s.lastMsg}
          </p>
          <div>
            <p className="font-mono text-[10px] text-muted mb-1">My fleet</p>
            {renderGrid(s.grids[s.current - 1]!, true, () => {})}
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted mb-1">
              Enemy waters — Player {s.current}
            </p>
            {renderGrid(
              s.grids[s.current === 1 ? 1 : 0]!,
              false,
              s.phase === "combat" ? combatClick : () => {},
            )}
          </div>
          {s.phase === "over" ? (
            <div className="text-center space-y-3">
              <p className="font-display text-2xl">Player {s.winner} wins</p>
              <Button onClick={() => setS(initial)}>Again</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </GameShell>
  );
}
