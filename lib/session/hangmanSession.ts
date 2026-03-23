export type HangmanSyncState = {
  game: "hangman";
  phase: "lobby" | "entry" | "guessing" | "won" | "lost";
  maskedDisplay: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrong: number;
  revealWord?: string;
};

export function initialHangmanSync(): HangmanSyncState {
  return {
    game: "hangman",
    phase: "lobby",
    maskedDisplay: "",
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrong: 6,
  };
}
