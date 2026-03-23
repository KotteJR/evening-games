export const BS_SIZE = 10;

export type ShipName =
  | "Carrier"
  | "Battleship"
  | "Cruiser"
  | "Submarine"
  | "Destroyer";

export const SHIP_LENGTHS: Record<ShipName, number> = {
  Carrier: 5,
  Battleship: 4,
  Cruiser: 3,
  Submarine: 3,
  Destroyer: 2,
};

export const SHIP_ORDER: ShipName[] = [
  "Carrier",
  "Battleship",
  "Cruiser",
  "Submarine",
  "Destroyer",
];

export type Cell = { ship: ShipName | null; hit: boolean };
export type Grid = Cell[][];

export type PlacedShip = {
  name: ShipName;
  cells: { r: number; c: number }[];
};

export function emptyGrid(): Grid {
  return Array.from({ length: BS_SIZE }, () =>
    Array.from({ length: BS_SIZE }, () => ({ ship: null, hit: false })),
  );
}

export function canPlace(
  grid: Grid,
  r: number,
  c: number,
  len: number,
  horizontal: boolean,
): boolean {
  for (let i = 0; i < len; i++) {
    const rr = horizontal ? r : r + i;
    const cc = horizontal ? c + i : c;
    if (rr < 0 || cc < 0 || rr >= BS_SIZE || cc >= BS_SIZE) return false;
    if (grid[rr]![cc]!.ship) return false;
  }
  return true;
}

export function placeShip(
  grid: Grid,
  name: ShipName,
  r: number,
  c: number,
  horizontal: boolean,
): PlacedShip | null {
  const len = SHIP_LENGTHS[name];
  if (!canPlace(grid, r, c, len, horizontal)) return null;
  const cells: { r: number; c: number }[] = [];
  for (let i = 0; i < len; i++) {
    const rr = horizontal ? r : r + i;
    const cc = horizontal ? c + i : c;
    grid[rr]![cc]!.ship = name;
    cells.push({ r: rr, c: cc });
  }
  return { name, cells };
}

export function allShipsPlaced(ships: PlacedShip[]): boolean {
  return ships.length === SHIP_ORDER.length;
}

export function fire(
  grid: Grid,
  r: number,
  c: number,
): { hit: boolean; sunk: ShipName | null } {
  const cell = grid[r]![c]!;
  if (cell.hit) return { hit: cell.ship !== null, sunk: null };
  cell.hit = true;
  if (!cell.ship) return { hit: false, sunk: null };
  const name = cell.ship;
  let covered = 0;
  let hits = 0;
  for (let rr = 0; rr < BS_SIZE; rr++) {
    for (let cc = 0; cc < BS_SIZE; cc++) {
      const cl = grid[rr]![cc]!;
      if (cl.ship === name) {
        covered++;
        if (cl.hit) hits++;
      }
    }
  }
  return { hit: true, sunk: hits === covered ? name : null };
}
