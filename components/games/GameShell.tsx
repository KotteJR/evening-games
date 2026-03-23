import Link from "next/link";
import { PlayerIndicator } from "@/components/ui/PlayerIndicator";

/** Shared content width for games — centered on the viewport. */
const SHELL = "mx-auto w-full max-w-2xl px-4";

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
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <div className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className={`flex items-center justify-between gap-3 pb-2 pt-12 sm:pt-4 ${SHELL}`}>
          <Link
            href="/"
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
          >
            ← Menu
          </Link>
          <h1 className="truncate text-right font-display text-base text-ink sm:text-lg">
            {title}
          </h1>
        </div>
        <PlayerIndicator
          currentPlayer={currentPlayer}
          player1Name={player1Name}
          player2Name={player2Name}
        />
      </div>
      <main
        className={`flex min-h-0 flex-1 flex-col items-center justify-start pb-14 pt-8 sm:justify-center sm:pt-6 ${SHELL}`}
      >
        <div className="flex w-full max-w-xl flex-col items-center gap-8">
          {children}
        </div>
      </main>
    </div>
  );
}
