import { HangmanGame } from "@/components/games/hangman/HangmanGame";
import { PlayModeGate } from "@/components/session/PlayModeGate";

export default function Page() {
  return (
    <PlayModeGate gameKey="hangman" title="Hangman">
      <HangmanGame />
    </PlayModeGate>
  );
}
