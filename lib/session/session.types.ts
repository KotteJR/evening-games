import type { UnoColor } from "@/lib/utils/deck";
import type { PlacedShip } from "@/lib/games/battleship";

export type PlayerRole = 1 | 2 | "host";

export type SessionPlayer = {
  name: string;
  role: PlayerRole;
  connectionId: string;
  deviceType: "phone" | "desktop";
};

export type Point = { x: number; y: number };

export type DrawTool = {
  brush: "s" | "m" | "l";
  eraser: boolean;
};

export type PlayerAction =
  | { game: "durak"; action: "PLAY_CARD"; cardId: string; player: 1 | 2 }
  | { game: "durak"; action: "PICK_UP"; player: 1 | 2 }
  | { game: "durak"; action: "COMMIT_ATTACK"; cardIds: string[]; player: 1 | 2 }
  | { game: "durak"; action: "DEFEND"; cardId: string; row: number; player: 1 | 2 }
  | { game: "uno"; action: "PLAY_CARD"; cardId: string; player: 1 | 2 }
  | { game: "uno"; action: "DRAW_CARD"; player: 1 | 2 }
  | { game: "uno"; action: "UNO_CALL"; player: 1 | 2 }
  | { game: "uno"; action: "CHOOSE_COLOR"; color: UnoColor; player: 1 | 2 }
  | { game: "battleship"; action: "FIRE"; x: number; y: number; player: 1 | 2 }
  | {
      game: "battleship";
      action: "PLACE_SHIP";
      ship: PlacedShip;
      player: 1 | 2;
      horizontal: boolean;
    }
  | { game: "battleship"; action: "READY_FLEET"; player: 1 | 2 }
  | { game: "battleship"; action: "TOGGLE_ORIENTATION"; player: 1 | 2 }
  | { game: "hangman"; action: "SET_WORD"; word: string; player?: 1 | 2 }
  | { game: "hangman"; action: "GUESS_LETTER"; letter: string; player?: 1 | 2 }
  | { game: "draw"; action: "STROKE"; points: Point[]; tool: DrawTool }
  | { game: "draw"; action: "CLEAR" }
  | { game: "draw"; action: "GUESS"; text: string }
  | { game: "draw"; action: "START_ROUND"; word?: string }
  | { game: "draw"; action: "END_DRAW" };

export type SessionMessage =
  | { type: "JOIN"; payload: { name: string; deviceType: "phone" | "desktop"; isHost: boolean } }
  | { type: "STATE_UPDATE"; payload: unknown }
  /** Relayed to every client (including host) for real-time strokes etc. */
  | { type: "PLAYER_ACTION"; payload: PlayerAction }
  | { type: "SYNC"; payload: unknown }
  | { type: "PLAYERS_UPDATE"; payload: SessionPlayer[] }
  | { type: "ASSIGN"; payload: { role: PlayerRole; isHost: boolean; connectionId: string } }
  | { type: "ERROR"; payload: { message: string } };
