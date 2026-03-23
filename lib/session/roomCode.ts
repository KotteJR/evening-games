const ADJECTIVES = [
  "DARK",
  "BOLD",
  "WILD",
  "COLD",
  "FAST",
  "CALM",
  "LOUD",
  "SLIM",
  "KEEN",
  "GRIM",
];

const NOUNS = [
  "WOLF",
  "CARD",
  "KING",
  "MOON",
  "STAR",
  "HAWK",
  "ROOK",
  "PAWN",
  "JACK",
  "COAL",
];

export function generateRoomCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  return `${adj}-${noun}`;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z]+-[A-Z]+$/i.test(code.trim());
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}
