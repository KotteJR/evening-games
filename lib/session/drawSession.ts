import type { DrawTool, Point } from "@/lib/session/session.types";

export type DrawStroke = { points: Point[]; tool: DrawTool };

export type DrawSyncState = {
  game: "draw";
  status: "lobby" | "draw" | "guess" | "reveal";
  strokes: DrawStroke[];
  timeLeft: number;
  roundEndsAt: number | null;
  /** Base64 UTF-8 — only Player 1 UI should decode & show (honor-system privacy). */
  encWord?: string;
  result?: "win" | "time";
  revealWord?: string;
  guessSubmitted?: string;
};

export function encodeWordForDrawer(word: string): string {
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(word)));
}

export function decodeDrawerWord(enc: string): string {
  if (typeof window === "undefined") return "";
  try {
    return decodeURIComponent(escape(atob(enc)));
  } catch {
    return "";
  }
}

export function initialDrawSync(): DrawSyncState {
  return {
    game: "draw",
    status: "lobby",
    strokes: [],
    timeLeft: 60_000,
    roundEndsAt: null,
  };
}
