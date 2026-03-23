type Props = {
  currentPlayer: 1 | 2;
  player1Name?: string;
  player2Name?: string;
};

export function PlayerIndicator({
  currentPlayer,
  player1Name = "Player 1",
  player2Name = "Player 2",
}: Props) {
  const p1Active = currentPlayer === 1;
  const p2Active = currentPlayer === 2;

  return (
    <header
      className="mx-auto flex w-full max-w-2xl items-center justify-between border-b border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em]"
      aria-live="polite"
    >
      <div
        className={`text-left ${p1Active ? "text-ink" : "text-muted"}`}
        aria-current={p1Active ? "step" : undefined}
      >
        {p1Active ? <span className="mr-1">•</span> : null}
        {p1Active ? `${player1Name}'s Turn` : player1Name}
      </div>
      <div
        className={`text-right ${p2Active ? "text-ink" : "text-muted"}`}
        aria-current={p2Active ? "step" : undefined}
      >
        {p2Active ? `${player2Name}'s Turn` : null}
        {p2Active ? <span className="ml-1">•</span> : null}
        {!p2Active ? player2Name : null}
      </div>
    </header>
  );
}
