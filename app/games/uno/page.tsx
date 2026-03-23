import { UnoGame } from "@/components/games/uno/UnoGame";
import { PlayModeGate } from "@/components/session/PlayModeGate";

export default function Page() {
  return (
    <PlayModeGate gameKey="uno" title="Uno">
      <UnoGame />
    </PlayModeGate>
  );
}
