type Props = {
  scores: [number, number];
  labels?: [string, string];
};

export function ScoreBoard({
  scores,
  labels = ["Player 1", "Player 2"],
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 mb-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {labels[0]}
        </p>
        <p className="font-display text-3xl text-white leading-none">{scores[0]}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {labels[1]}
        </p>
        <p className="font-display text-3xl text-white leading-none">{scores[1]}</p>
      </div>
    </div>
  );
}
