import type { DurakCard, Suit } from "@/lib/utils/deck";

const RANK_ORDER = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;

export function rankIndex(rank: DurakCard["rank"]): number {
  return RANK_ORDER.indexOf(rank as (typeof RANK_ORDER)[number]);
}

export function cardBeats(
  attack: DurakCard,
  defense: DurakCard,
  trump: Suit,
): boolean {
  const aT = attack.suit === trump;
  const dT = defense.suit === trump;
  if (!aT && dT) return true;
  if (aT && dT) return rankIndex(defense.rank) > rankIndex(attack.rank);
  if (!aT && !dT && defense.suit === attack.suit) {
    return rankIndex(defense.rank) > rankIndex(attack.rank);
  }
  return false;
}

export function ranksOnTable(
  table: { attack: DurakCard; defense: DurakCard | null }[],
): Set<string> {
  const s = new Set<string>();
  for (const row of table) {
    s.add(row.attack.rank);
    if (row.defense) s.add(row.defense.rank);
  }
  return s;
}

export function canAddAttackCard(
  table: { attack: DurakCard; defense: DurakCard | null }[],
  card: DurakCard,
  defenderHandSize: number,
): boolean {
  if (table.length === 0) return true;
  if (table.length >= Math.min(6, defenderHandSize)) return false;
  const ranks = ranksOnTable(table);
  return ranks.has(card.rank);
}

export function allDefended(
  table: { attack: DurakCard; defense: DurakCard | null }[],
): boolean {
  return table.length > 0 && table.every((r) => r.defense !== null);
}

export function drawHands(
  deck: DurakCard[],
  hands: [DurakCard[], DurakCard[]],
  attacker: 1 | 2,
  defender: 1 | 2,
) {
  const order: (1 | 2)[] = [attacker, defender];
  for (const p of order) {
    const h = hands[p - 1];
    while (h.length < 6 && deck.length > 0) {
      h.push(deck.pop()!);
    }
  }
}

export function removeCard(hand: DurakCard[], id: string): DurakCard | null {
  const i = hand.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const [c] = hand.splice(i, 1);
  return c ?? null;
}
