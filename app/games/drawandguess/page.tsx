import { DrawGuessGame } from "@/components/games/drawandguess/DrawGuessGame";
import { PlayModeGate } from "@/components/session/PlayModeGate";

export default function Page() {
  return (
    <PlayModeGate gameKey="drawandguess" title="Draw & Guess">
      <DrawGuessGame />
    </PlayModeGate>
  );
}
