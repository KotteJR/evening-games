export type Suit = "♠" | "♣" | "♥" | "♦";

export type StandardRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type StandardCard = {
  suit: Suit;
  rank: StandardRank;
  id: string;
};

export type DurakRank = "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export type DurakCard = {
  suit: Suit;
  rank: DurakRank;
  id: string;
};

export type UnoColor = "stripes" | "dots" | "hatching" | "solid" | "wild";

export type UnoValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild4";

export type UnoCard = {
  color: UnoColor;
  value: UnoValue;
  id: string;
};

let idCounter = 0;
function nid() {
  return `c${++idCounter}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SUITS: Suit[] = ["♠", "♣", "♥", "♦"];
const STD_RANKS: StandardRank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export function createDeck(): StandardCard[] {
  const deck: StandardCard[] = [];
  for (const suit of SUITS) {
    for (const rank of STD_RANKS) {
      deck.push({ suit, rank, id: nid() });
    }
  }
  return deck;
}

const DURAK_RANKS: DurakRank[] = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function createDurakDeck(): DurakCard[] {
  const deck: DurakCard[] = [];
  for (const suit of SUITS) {
    for (const rank of DURAK_RANKS) {
      deck.push({ suit, rank, id: nid() });
    }
  }
  return deck;
}

function pushColorRun(
  deck: UnoCard[],
  color: Exclude<UnoColor, "wild">,
  counts: Partial<Record<UnoValue, number>>,
) {
  (Object.keys(counts) as UnoValue[]).forEach((value) => {
    const n = counts[value];
    if (n == null) return;
    for (let i = 0; i < n; i++) {
      deck.push({ color, value, id: nid() });
    }
  });
}

export function createUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: Exclude<UnoColor, "wild">[] = [
    "stripes",
    "dots",
    "hatching",
    "solid",
  ];
  for (const color of colors) {
    pushColorRun(deck, color, { "0": 1 });
    for (const v of [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ] as const) {
      pushColorRun(deck, color, { [v]: 2 });
    }
    pushColorRun(deck, color, { skip: 2, reverse: 2, draw2: 2 });
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild", id: nid() });
    deck.push({ color: "wild", value: "wild4", id: nid() });
  }
  return deck;
}
