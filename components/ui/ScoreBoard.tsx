type Props = {
  scores: [number, number];
  labels?: [string, string];
};

const DEFAULT_LABELS: [string, string] = ["Player 1", "Player 2"];

export function ScoreBoard({ scores, labels = DEFAULT_LABELS }: Props) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4 rounded-brand-lg border border-border bg-surface-2/50 px-4 py-4 text-center">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {labels[0]}
        </p>
        <p className="font-display text-3xl leading-none text-ink">{scores[0]}</p>
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {labels[1]}
        </p>
        <p className="font-display text-3xl leading-none text-ink">{scores[1]}</p>
      </div>
    </div>
  );
}
