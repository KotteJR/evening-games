import {
  BS_SIZE,
  SHIP_ORDER,
  allShipsPlaced,
  emptyGrid,
  fire,
  placeShip,
  type Grid,
  type PlacedShip,
  type ShipName,
} from "@/lib/games/battleship";
import type { PlayerAction } from "@/lib/session/session.types";

export type BsPhase = "lobby" | "placement" | "combat" | "over";

export type FogCell = "e" | "m" | "h";

export type BattleshipFullState = {
  game: "battleship";
  phase: BsPhase;
  grids: [Grid, Grid];
  ships: [PlacedShip[], PlacedShip[]];
  horizontal: [boolean, boolean];
  activeShip: [ShipName | null, ShipName | null];
  ready: [boolean, boolean];
  current: 1 | 2;
  lastMsg: string;
  winner: 1 | 2 | null;
};

export type BattleshipPublicState = {
  game: "battleship";
  phase: BsPhase;
  fog: [FogCell[][], FogCell[][]];
  current: 1 | 2;
  lastMsg: string;
  winner: 1 | 2 | null;
  placement: {
    shipsPlaced: [number, number];
    ready: [boolean, boolean];
    nextShip: [ShipName | null, ShipName | null];
    horizontal: [boolean, boolean];
  };
};

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.map((c) => ({ ...c })));
}

function fogFromGrid(g: Grid): FogCell[][] {
  return g.map((row) =>
    row.map((c) => (!c.hit ? "e" : c.ship ? "h" : "m")),
  );
}

function nextActiveShip(ships: PlacedShip[]): ShipName | null {
  return SHIP_ORDER[ships.length] ?? null;
}

export function battleshipInitialLobby(): BattleshipFullState {
  return {
    game: "battleship",
    phase: "lobby",
    grids: [emptyGrid(), emptyGrid()],
    ships: [[], []],
    horizontal: [true, true],
    activeShip: [null, null],
    ready: [false, false],
    current: 1,
    lastMsg: "",
    winner: null,
  };
}

export function battleshipStartFromLobby(s: BattleshipFullState): BattleshipFullState {
  if (s.phase !== "lobby") return s;
  return {
    ...s,
    phase: "placement",
    grids: [emptyGrid(), emptyGrid()],
    ships: [[], []],
    horizontal: [true, true],
    activeShip: ["Carrier", "Carrier"],
    ready: [false, false],
    lastMsg: "Place fleets on your phones",
  };
}

export function battleshipToPublic(s: BattleshipFullState): BattleshipPublicState {
  return {
    game: "battleship",
    phase: s.phase,
    fog: [fogFromGrid(s.grids[0]), fogFromGrid(s.grids[1])],
    current: s.current,
    lastMsg: s.lastMsg,
    winner: s.winner,
    placement: {
      shipsPlaced: [s.ships[0].length, s.ships[1].length],
      ready: [...s.ready],
      nextShip: [...s.activeShip],
      horizontal: [...s.horizontal],
    },
  };
}

export function battleshipSecretsFromFull(s: BattleshipFullState) {
  return {
    "1": { myGrid: s.grids[0] },
    "2": { myGrid: s.grids[1] },
  };
}

export function battleshipApplyPlayerAction(
  state: BattleshipFullState,
  action: PlayerAction,
): BattleshipFullState | null {
  if (action.game !== "battleship") return null;
  const p = action.player;
  const idx = p - 1;

  if (action.action === "TOGGLE_ORIENTATION") {
    if (state.phase !== "placement" || state.ready[idx]) return null;
    const horizontal: [boolean, boolean] = [...state.horizontal];
    horizontal[idx] = !horizontal[idx];
    return { ...state, horizontal };
  }

  if (action.action === "PLACE_SHIP") {
    if (state.phase !== "placement" || state.ready[idx]) return null;
    const name = state.activeShip[idx];
    if (!name || action.ship.name !== name) return null;
    if (action.ship.cells.length < 1) return null;
    const sorted = [...action.ship.cells].sort(
      (a, b) => a.r - b.r || a.c - b.c,
    );
    const first = sorted[0]!;
    const grid = cloneGrid(state.grids[idx]!);
    const horiz = action.horizontal;
    const placed = placeShip(grid, name, first.r, first.c, horiz);
    if (!placed) return null;
    const horizontal: [boolean, boolean] = [...state.horizontal];
    horizontal[idx] = horiz;
    const ships: [PlacedShip[], PlacedShip[]] = [
      [...state.ships[0]],
      [...state.ships[1]],
    ];
    ships[idx].push(placed);
    const activeShip: [ShipName | null, ShipName | null] = [
      ...state.activeShip,
    ];
    activeShip[idx] = nextActiveShip(ships[idx]);
    const grids: [Grid, Grid] = [...state.grids];
    grids[idx] = grid;
    return {
      ...state,
      grids,
      ships,
      horizontal,
      activeShip,
      lastMsg: `Player ${p} placed ${name}`,
    };
  }

  if (action.action === "READY_FLEET") {
    if (state.phase !== "placement") return null;
    if (!allShipsPlaced(state.ships[idx]!)) return null;
    const ready: [boolean, boolean] = [...state.ready];
    ready[idx] = true;
    let next: BattleshipFullState = { ...state, ready };
    if (ready[0] && ready[1]) {
      next = {
        ...next,
        phase: "combat",
        current: 1,
        lastMsg: "Combat — Player 1 fires",
      };
    }
    return next;
  }

  if (action.action === "FIRE") {
    if (state.phase !== "combat") return null;
    if (p !== state.current) return null;
    const attacker = p;
    const enemyIdx = attacker === 1 ? 1 : 0;
    const enemyGrid = cloneGrid(state.grids[enemyIdx]!);
    const { x: r, y: c } = action;
    if (r < 0 || c < 0 || r >= BS_SIZE || c >= BS_SIZE) return null;
    const cell = enemyGrid[r]![c]!;
    if (cell.hit) return null;
    const { hit, sunk } = fire(enemyGrid, r, c);
    const grids: [Grid, Grid] = [...state.grids];
    grids[enemyIdx] = enemyGrid;

    let msg = hit ? "HIT!" : "MISS";
    if (sunk) msg = `SUNK — ${sunk}`;

    const allHit = enemyGrid
      .flat()
      .every((cl) => cl.ship === null || cl.hit);
    return {
      ...state,
      grids,
      lastMsg: msg,
      current: attacker === 1 ? 2 : 1,
      phase: allHit ? "over" : "combat",
      winner: allHit ? attacker : null,
    };
  }

  return null;
}

export function battleshipRematch(): BattleshipFullState {
  return battleshipStartFromLobby(battleshipInitialLobby());
}
