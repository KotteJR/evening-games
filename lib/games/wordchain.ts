export type WordChainCategory = "animals" | "countries" | "foods" | "free";

export type WordChainState = {
  chain: string[];
  category: WordChainCategory;
  currentPlayer: 1 | 2;
  timeLeft: number;
  status: "playing" | "gameover";
  loser: 1 | 2 | null;
  used: string[];
};

export function normalizeChainWord(w: string): string {
  return w.trim().toLowerCase();
}

export function lastLetter(word: string): string | null {
  const t = word.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!t.length) return null;
  return t[t.length - 1]!;
}

export function validateMove(
  word: string,
  chain: string[],
  used: Set<string>,
  allowedSet: Set<string> | null,
): { ok: true } | { ok: false; reason: string } {
  const n = normalizeChainWord(word);
  if (!n) return { ok: false, reason: "Enter a word." };
  if (!/^[a-z]+(?: [a-z]+)*$/.test(n) && n.includes(" "))
    return { ok: false, reason: "Use letters only (spaces ok for multi-word)." };
  if (!/^[a-z]+$/i.test(n.replace(/\s/g, "")))
    return { ok: false, reason: "Invalid characters." };
  const single = n.replace(/\s/g, "");
  if (allowedSet && !allowedSet.has(n) && !allowedSet.has(single))
    return { ok: false, reason: "Not in this category list." };
  if (used.has(n) || used.has(single))
    return { ok: false, reason: "Word already used." };
  if (chain.length === 0) return { ok: true };
  const need = lastLetter(chain[0]!);
  const start = single[0];
  if (!need || start !== need)
    return { ok: false, reason: `Must start with "${need?.toUpperCase() ?? ""}".` };
  return { ok: true };
}
