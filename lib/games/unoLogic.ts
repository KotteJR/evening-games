import type { UnoCard, UnoColor } from "@/lib/utils/deck";

export function isWild(c: UnoCard): boolean {
  return c.color === "wild" || c.value === "wild" || c.value === "wild4";
}

export function topDiscard(discard: UnoCard[]): UnoCard | null {
  for (let i = discard.length - 1; i >= 0; i--) {
    const c = discard[i]!;
    if (c.value !== "wild" && c.value !== "wild4") return c;
    if (i === 0) return c;
  }
  return null;
}

export function canPlayCard(
  handCard: UnoCard,
  discardTop: UnoCard,
  currentColor: UnoColor,
): boolean {
  if (handCard.color === "wild") return true;
  if (handCard.color === currentColor) return true;
  if (discardTop.color === "wild") {
    return handCard.color === currentColor;
  }
  if (handCard.value === discardTop.value && handCard.value !== "wild4")
    return true;
  return false;
}

export function cardPoints(c: UnoCard): number {
  if (c.value === "wild4" || c.value === "wild") return 50;
  if (
    c.value === "skip" ||
    c.value === "reverse" ||
    c.value === "draw2"
  )
    return 20;
  if (c.value === "0") return 0;
  const n = Number(c.value);
  return Number.isFinite(n) ? n : 20;
}

export function scoreHand(hand: UnoCard[]): number {
  return hand.reduce((s, c) => s + cardPoints(c), 0);
}

export function nextPlayer(cur: 1 | 2, dir: 1 | -1): 1 | 2 {
  if (dir === 1) return cur === 1 ? 2 : 1;
  return cur === 1 ? 2 : 1;
}

export type UnoEffect =
  | { kind: "none" }
  | { kind: "skip" }
  | { kind: "reverse" }
  | { kind: "draw"; n: 2 | 4 };

export function effectForCard(
  c: UnoCard,
  chosenColor?: UnoColor,
): { color: UnoColor; effect: UnoEffect } {
  if (c.value === "wild4")
    return { color: chosenColor ?? "solid", effect: { kind: "draw", n: 4 } };
  if (c.value === "wild")
    return { color: chosenColor ?? "solid", effect: { kind: "none" } };
  if (c.value === "draw2")
    return { color: c.color as UnoColor, effect: { kind: "draw", n: 2 } };
  if (c.value === "skip")
    return { color: c.color as UnoColor, effect: { kind: "skip" } };
  if (c.value === "reverse")
    return { color: c.color as UnoColor, effect: { kind: "reverse" } };
  return { color: c.color as UnoColor, effect: { kind: "none" } };
}
