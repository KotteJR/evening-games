import Link from "next/link";
import { PlayerIndicator } from "@/components/ui/PlayerIndicator";

type Props = {
  title: string;
  currentPlayer: 1 | 2;
  children: React.ReactNode;
  player1Name?: string;
  player2Name?: string;
};

export function GameShell({
  title,
  currentPlayer,
  children,
  player1Name,
  player2Name,
}: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-ink">
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-phone mx-auto px-3 pt-3 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-white shrink-0"
          >
            ← Menu
          </Link>
          <h1 className="font-display text-sm sm:text-base text-white truncate text-right">
            {title}
          </h1>
        </div>
        <PlayerIndicator
          currentPlayer={currentPlayer}
          player1Name={player1Name}
          player2Name={player2Name}
        />
      </div>
      <main className="flex-1 flex flex-col justify-center max-w-phone w-full mx-auto px-3 pb-10 pt-4 min-h-0">
        <div className="w-full py-4">{children}</div>
      </main>
    </div>
  );
}
