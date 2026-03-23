import { DurakGame } from "@/components/games/durak/DurakGame";
import { PlayModeGate } from "@/components/session/PlayModeGate";

export default function Page() {
  return (
    <PlayModeGate gameKey="durak" title="Durak">
      <DurakGame />
    </PlayModeGate>
  );
}
