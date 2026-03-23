import { BattleshipGame } from "@/components/games/battleship/BattleshipGame";
import { PlayModeGate } from "@/components/session/PlayModeGate";

export default function Page() {
  return (
    <PlayModeGate gameKey="battleship" title="Battleship">
      <BattleshipGame />
    </PlayModeGate>
  );
}
