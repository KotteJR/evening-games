import type { DurakCard } from "@/lib/utils/deck";
import { createDurakDeck, shuffle } from "@/lib/utils/deck";
import {
  allDefended,
  canAddAttackCard,
  cardBeats,
  drawHands,
  ranksOnTable,
  removeCard,
} from "@/lib/games/durakLogic";
import type { PlayerAction } from "@/lib/session/session.types";

export type DurakTableRow = { attack: DurakCard; defense: DurakCard | null };

export type DurakPhase = "lobby" | "attack" | "defend" | "gameover";

export type DurakFullState = {
  game: "durak";
  phase: DurakPhase;
  deck: DurakCard[];
  hands: [DurakCard[], DurakCard[]];
  table: DurakTableRow[];
  trumpCard: DurakCard;
  trumpSuit: DurakCard["suit"];
  discard: DurakCard[];
  attacker: 1 | 2;
  defender: 1 | 2;
  scores: [number, number];
};

export type DurakPublicState = {
  game: "durak";
  phase: DurakPhase;
  deckCount: number;
  handCounts: [number, number];
  table: DurakTableRow[];
  trumpCard: DurakCard;
  trumpSuit: DurakCard["suit"];
  discardCount: number;
  attacker: 1 | 2;
  defender: 1 | 2;
  scores: [number, number];
};

const TARGET = 3;

function dummyTrump(): DurakCard {
  return { suit: "♠", rank: "6", id: "__lobby__" };
}

export function durakInitialLobby(): DurakFullState {
  return {
    game: "durak",
    phase: "lobby",
    deck: [],
    hands: [[], []],
    table: [],
    trumpCard: dummyTrump(),
    trumpSuit: "♠",
    discard: [],
    attacker: 1,
    defender: 2,
    scores: [0, 0],
  };
}

function deal(scores: [number, number]): DurakFullState {
  const full = shuffle(createDurakDeck());
  const trumpCard = full[full.length - 1]!;
  const deck = full.slice(0, -1);
  const hands: [DurakCard[], DurakCard[]] = [[], []];
  while (hands[0].length < 6 && deck.length) hands[0].push(deck.pop()!);
  while (hands[1].length < 6 && deck.length) hands[1].push(deck.pop()!);
  return {
    game: "durak",
    phase: "attack",
    deck,
    hands,
    table: [],
    trumpCard,
    trumpSuit: trumpCard.suit,
    discard: [],
    attacker: 1,
    defender: 2,
    scores,
  };
}

function afterHandsRefilled(g: DurakFullState): DurakFullState {
  const empty1 = g.hands[0].length === 0;
  const empty2 = g.hands[1].length === 0;
  if (g.deck.length > 0) return g;
  if (empty1 !== empty2) {
    const scores: [number, number] = [
      g.scores[0] + (empty2 ? 1 : 0),
      g.scores[1] + (empty1 ? 1 : 0),
    ];
    if (scores[0] >= TARGET || scores[1] >= TARGET) {
      return { ...g, phase: "gameover", scores };
    }
    return deal(scores);
  }
  return g;
}

export function durakToPublic(s: DurakFullState): DurakPublicState {
  return {
    game: "durak",
    phase: s.phase,
    deckCount: s.deck.length,
    handCounts: [s.hands[0].length, s.hands[1].length],
    table: s.table,
    trumpCard: s.trumpCard,
    trumpSuit: s.trumpSuit,
    discardCount: s.discard.length,
    attacker: s.attacker,
    defender: s.defender,
    scores: s.scores,
  };
}

export function durakSecretsFromFull(s: DurakFullState) {
  return {
    "1": { hand: s.hands[0] },
    "2": { hand: s.hands[1] },
  };
}

export function durakApplyPlayerAction(
  state: DurakFullState,
  action: PlayerAction,
): DurakFullState | null {
  if (action.game !== "durak") return null;
  const p = action.player;

  if (action.action === "COMMIT_ATTACK") {
    if (state.phase !== "attack" || p !== state.attacker) return null;
    const cards: DurakCard[] = [];
    const hands: [DurakCard[], DurakCard[]] = [
      [...state.hands[0]],
      [...state.hands[1]],
    ];
    const ah2 = hands[p - 1];
    for (const id of action.cardIds) {
      const c = removeCard(ah2, id);
      if (c) cards.push(c);
    }
    if (cards.length === 0) return null;
    const defenderHand = hands[state.defender - 1];
    const pretend = [...state.table];
    for (const c of cards) {
      if (!canAddAttackCard(pretend, c, defenderHand.length)) return null;
      pretend.push({ attack: c, defense: null });
    }
    return {
      ...state,
      hands,
      table: pretend,
      phase: "defend",
    };
  }

  if (action.action === "PICK_UP") {
    if (state.phase !== "defend" || p !== state.defender) return null;
    const hands: [DurakCard[], DurakCard[]] = [
      [...state.hands[0]],
      [...state.hands[1]],
    ];
    const dh = hands[state.defender - 1];
    for (const row of state.table) {
      dh.push(row.attack);
      if (row.defense) dh.push(row.defense);
    }
    let next: DurakFullState = {
      ...state,
      hands,
      table: [],
      phase: "attack",
    };
    drawHands(next.deck, next.hands, next.attacker, next.defender);
    next = afterHandsRefilled(next);
    return next;
  }

  if (action.action === "DEFEND") {
    if (state.phase !== "defend" || p !== state.defender) return null;
    const row = state.table[action.row];
    if (!row || row.defense) return null;
    const dh = state.hands[p - 1];
    const card = dh.find((c) => c.id === action.cardId);
    if (!card || !cardBeats(row.attack, card, state.trumpSuit)) return null;
    const hands: [DurakCard[], DurakCard[]] = [
      [...state.hands[0]],
      [...state.hands[1]],
    ];
    removeCard(hands[p - 1], action.cardId);
    const table = state.table.map((r, i) =>
      i === action.row ? { ...r, defense: card } : r,
    );
    let next: DurakFullState = { ...state, hands, table };
    if (allDefended(table)) {
      const discard = [...next.discard];
      for (const rw of table) {
        discard.push(rw.attack);
        if (rw.defense) discard.push(rw.defense);
      }
      next = {
        ...next,
        discard,
        table: [],
        attacker: next.defender,
        defender: next.attacker,
        phase: "attack",
      };
      drawHands(next.deck, next.hands, next.attacker, next.defender);
      next = afterHandsRefilled(next);
    }
    return next;
  }

  if (action.action === "PLAY_CARD") {
    return null;
  }

  return null;
}

export function durakStartFromLobby(state: DurakFullState): DurakFullState {
  if (state.phase !== "lobby") return state;
  return deal(state.scores);
}

export { ranksOnTable };
