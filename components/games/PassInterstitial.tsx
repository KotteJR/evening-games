"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  player: 1 | 2;
  onReady: () => void;
  subtitle?: string;
};

export function PassInterstitial({ player, onReady, subtitle }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-4">
        Pass the device
      </p>
      <h1 className="font-display text-[clamp(2rem,10vw,3.5rem)] text-white mb-2">
        Player {player}
      </h1>
      <p className="font-mono text-sm text-white/80 mb-8">Your turn</p>
      {subtitle ? (
        <p className="font-mono text-xs text-muted max-w-phone mb-8">{subtitle}</p>
      ) : null}
      <Button onClick={onReady} className="min-w-[200px]">
        Ready
      </Button>
    </div>
  );
}
