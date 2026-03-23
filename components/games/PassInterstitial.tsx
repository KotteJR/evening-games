"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  player: 1 | 2;
  onReady: () => void;
  subtitle?: string;
};

export function PassInterstitial({ player, onReady, subtitle }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg/95 px-6 text-center backdrop-blur-md">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        Pass the device
      </p>
      <h1 className="mb-2 font-display text-[clamp(2rem,10vw,3.5rem)] text-ink">
        Player {player}
      </h1>
      <p className="mb-8 font-mono text-sm text-muted">Your turn</p>
      {subtitle ? (
        <p className="mb-8 max-w-phone font-mono text-xs text-muted">{subtitle}</p>
      ) : null}
      <Button onClick={onReady} className="min-w-[200px]">
        Ready
      </Button>
    </div>
  );
}
