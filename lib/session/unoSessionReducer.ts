import type { UnoCard, UnoColor } from "@/lib/utils/deck";
import { createUnoDeck, shuffle } from "@/lib/utils/deck";
import {
  canPlayCard,
  effectForCard,
  isWild,
  scoreHand,
} from "@/lib/games/unoLogic";
import type { PlayerAction } from "@/lib/session/session.types";

const TARGET = 500;

export type UnoPhase = "lobby" | "playing" | "choosingColor" | "gameover";

export type UnoFullState = {
  game: "uno";
  phase: UnoPhase;
  deck: UnoCard[];
  hands: [UnoCard[], UnoCard[]];
  discard: UnoCard[];
  currentPlayer: 1 | 2;
  currentColor: UnoColor;
  direction: 1 | -1;
  scores: [number, number];
  pendingWild: UnoCard | null;
  unoAcknowledged: boolean;
};

export type UnoPublicState = {
  game: "uno";
  phase: UnoPhase;
  handCounts: [number, number];
  deckCount: number;
  discard: UnoCard[];
  currentPlayer: 1 | 2;
  currentColor: UnoColor;
  direction: 1 | -1;
  scores: [number, number];
  /** That player must tap UNO! before playing their last card. */
  unoRequiredBy: 1 | 2 | null;
};

function flipPlayer(p: 1 | 2, times: number): 1 | 2 {
  let x = p;
  for (let i = 0; i < times; i++) x = x === 1 ? 2 : 1;
  return x;
}

function drawFromPile(prev: UnoFullState): {
  deck: UnoCard[];
  discard: UnoCard[];
  card: UnoCard | null;
} {
  let deck = [...prev.deck];
  let discard = [...prev.discard];
  if (!deck.length && discard.length > 1) {
    const top = discard[discard.length - 1]!;
    const rest = discard.slice(0, -1);
    deck = shuffle(rest);
    discard = [top];
  }
  if (!deck.length) return { deck, discard, card: null };
  const card = deck.pop()!;
  return { deck, discard, card };
}

function freshRound(scores: [number, number]): UnoFullState {
  const deck = shuffle(createUnoDeck());
  const hands: [UnoCard[], UnoCard[]] = [[], []];
  for (let i = 0; i < 7; i++) {
    hands[0].push(deck.pop()!);
    hands[1].push(deck.pop()!);
  }
  const discard: UnoCard[] = [];
  let starter: UnoCard | undefined;
  while (deck.length) {
    const c = deck.pop()!;
    discard.push(c);
    if (!isWild(c)) {
      starter = c;
      break;
    }
  }
  if (!starter) starter = discard[discard.length - 1]!;
  const currentColor =
    starter.color === "wild" ? ("solid" as UnoColor) : starter.color;
  return {
    game: "uno",
    phase: "playing",
    deck,
    hands,
    discard,
    currentPlayer: 1,
    currentColor,
    direction: 1,
    scores,
    pendingWild: null,
    unoAcknowledged: false,
  };
}

export function unoInitialLobby(): UnoFullState {
  return {
    game: "uno",
    phase: "lobby",
    deck: [],
    hands: [[], []],
    discard: [],
    currentPlayer: 1,
    currentColor: "solid",
    direction: 1,
    scores: [0, 0],
    pendingWild: null,
    unoAcknowledged: false,
  };
}

function applyWinOrContinue(base: UnoFullState, winner: 1 | 2): UnoFullState {
  const loser = winner === 1 ? 2 : 1;
  const pts = scoreHand(base.hands[loser - 1]);
  const scores: [number, number] = [...base.scores];
  scores[winner - 1] += pts;
  if (scores[0] >= TARGET || scores[1] >= TARGET) {
    return { ...base, phase: "gameover", scores };
  }
  return freshRound(scores);
}

export function unoToPublic(s: UnoFullState): UnoPublicState {
  const h = s.hands[s.currentPlayer - 1];
  const unoRequiredBy =
    s.phase === "playing" &&
    !s.unoAcknowledged &&
    h.length === 1
      ? s.currentPlayer
      : null;
  return {
    game: "uno",
    phase: s.phase,
    handCounts: [s.hands[0].length, s.hands[1].length],
    deckCount: s.deck.length,
    discard: s.discard,
    currentPlayer: s.currentPlayer,
    currentColor: s.currentColor,
    direction: s.direction,
    scores: s.scores,
    unoRequiredBy,
  };
}

export function unoSecretsFromFull(s: UnoFullState) {
  return {
    "1": { hand: s.hands[0] },
    "2": { hand: s.hands[1] },
  };
}

export function unoStartFromLobby(s: UnoFullState): UnoFullState {
  if (s.phase !== "lobby") return s;
  return freshRound([0, 0]);
}

export function unoApplyPlayerAction(
  state: UnoFullState,
  action: PlayerAction,
): UnoFullState | null {
  if (action.game !== "uno") return null;
  const p = action.player;

  if (action.action === "PLAY_CARD") {
    if (state.phase !== "playing" || p !== state.currentPlayer) return null;
    const h = [...state.hands[p - 1]];
    const idx = h.findIndex((c) => c.id === action.cardId);
    if (idx < 0) return null;
    if (h.length === 1 && !state.unoAcknowledged) return null;
    const topC = state.discard[state.discard.length - 1];
    if (!topC) return null;
    const card = h[idx]!;
    if (!canPlayCard(card, topC, state.currentColor)) return null;
    h.splice(idx, 1);
    const hands: [UnoCard[], UnoCard[]] = [
      [...state.hands[0]],
      [...state.hands[1]],
    ];
    hands[p - 1] = h;
    const discard = [...state.discard, card];

    if (isWild(card)) {
      return {
        ...state,
        hands,
        discard,
        phase: "choosingColor",
        pendingWild: card,
      };
    }

    const { color, effect } = effectForCard(card);
    let next: UnoFullState = {
      ...state,
      hands,
      discard,
      currentColor: color,
      pendingWild: null,
    };

    if (h.length === 0) {
      return applyWinOrContinue(next, p);
    }

    const victim = flipPlayer(p, 1);

    if (effect.kind === "draw") {
      let deck = [...next.deck];
      let discardP = [...next.discard];
      const vh = [...next.hands[victim - 1]];
      const n = effect.n;
      for (let i = 0; i < n; i++) {
        const r = drawFromPile({ ...next, deck, discard: discardP });
        deck = r.deck;
        discardP = r.discard;
        if (!r.card) break;
        vh.push(r.card);
      }
      const nh: [UnoCard[], UnoCard[]] = [...next.hands];
      nh[victim - 1] = vh;
      next = {
        ...next,
        hands: nh,
        deck,
        discard: discardP,
        currentPlayer: flipPlayer(p, 2),
        unoAcknowledged: false,
      };
      return next;
    }

    const flips = effect.kind === "none" ? 1 : 2;
    next = {
      ...next,
      currentPlayer: flipPlayer(p, flips),
      unoAcknowledged: false,
    };
    return next;
  }

  if (action.action === "CHOOSE_COLOR") {
    if (state.phase !== "choosingColor" || p !== state.currentPlayer) return null;
    if (!state.pendingWild) return null;
    const { effect } = effectForCard(state.pendingWild, action.color);
    const next: UnoFullState = {
      ...state,
      phase: "playing",
      pendingWild: null,
      currentColor: action.color,
    };
    const h = next.hands[next.currentPlayer - 1];
    if (h.length === 0) {
      return applyWinOrContinue(next, next.currentPlayer);
    }
    const victim = flipPlayer(next.currentPlayer, 1);
    if (effect.kind === "draw") {
      const n = effect.n;
      let deck = [...next.deck];
      let discardP = [...next.discard];
      const vh = [...next.hands[victim - 1]];
      for (let i = 0; i < n; i++) {
        const r = drawFromPile({ ...next, deck, discard: discardP });
        deck = r.deck;
        discardP = r.discard;
        if (!r.card) break;
        vh.push(r.card);
      }
      const nh: [UnoCard[], UnoCard[]] = [...next.hands];
      nh[victim - 1] = vh;
      return {
        ...next,
        hands: nh,
        deck,
        discard: discardP,
        currentPlayer: flipPlayer(next.currentPlayer, 2),
        unoAcknowledged: false,
      };
    }
    return {
      ...next,
      currentPlayer: flipPlayer(next.currentPlayer, 1),
      unoAcknowledged: false,
    };
  }

  if (action.action === "DRAW_CARD") {
    if (state.phase !== "playing" || p !== state.currentPlayer) return null;
    const { deck, discard, card } = drawFromPile(state);
    if (!card) return null;
    const hands: [UnoCard[], UnoCard[]] = [
      [...state.hands[0]],
      [...state.hands[1]],
    ];
    const h = [...hands[p - 1]];
    h.push(card);
    hands[p - 1] = h;
    return {
      ...state,
      deck,
      discard,
      hands,
      unoAcknowledged: h.length === 1 ? false : state.unoAcknowledged,
    };
  }

  if (action.action === "UNO_CALL") {
    if (p !== state.currentPlayer) return null;
    return { ...state, unoAcknowledged: true };
  }

  return null;
}

export function unoRematch(): UnoFullState {
  return freshRound([0, 0]);
}
