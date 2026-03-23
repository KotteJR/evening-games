type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-brand border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted ${className}`}
    >
      {children}
    </span>
  );
}
