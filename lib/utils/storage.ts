const PREFIX = "nightgames:";

export function saveGame(gameId: string, state: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${PREFIX}${gameId}:state`,
      JSON.stringify(state),
    );
  } catch {
    /* ignore quota */
  }
}

export function loadGame<T>(gameId: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${gameId}:state`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearGame(gameId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${PREFIX}${gameId}:state`);
}
