export type HangmanPhase = "entry" | "guessing" | "won" | "lost";

export type HangmanState = {
  phase: HangmanPhase;
  word: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrong: number;
  currentPlayer: 1 | 2;
};

export const HANGMAN_STAGES = [
  `
            
            
            
            
    =====`,
  `
      -----
      |   |
      |
      |
      |
    =====`,
  `
      -----
      |   |
      |   O
      |
      |
    =====`,
  `
      -----
      |   |
      |   O
      |   |
      |
    =====`,
  `
      -----
      |   |
      |   O
      |  /|
      |
    =====`,
  `
      -----
      |   |
      |   O
      |  /|\\
      |
    =====`,
  `
      -----
      |   |
      |   O
      |  /|\\
      |  /
    =====`,
] as const;

export function normalizeWord(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z ]/g, "");
}

export function maskWord(word: string, guessed: Set<string>): string {
  return word
    .split("")
    .map((ch) => {
      if (ch === " ") return " ";
      return guessed.has(ch) ? ch : "_";
    })
    .join(" ");
}

export function isWin(word: string, guessed: Set<string>): boolean {
  const letters = new Set(word.replace(/ /g, "").split(""));
  return (
    letters.size > 0 &&
    Array.from(letters).every((L) => guessed.has(L))
  );
}
