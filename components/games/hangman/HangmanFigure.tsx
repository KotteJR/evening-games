"use client";

/** `wrong` = number of incorrect guesses, 0–6. Gallows always drawn; figure grows with mistakes. */
export function HangmanFigure({ wrong }: { wrong: number }) {
  const w = Math.min(6, Math.max(0, wrong));

  return (
    <svg
      viewBox="0 0 200 220"
      className="w-full max-w-[min(100%,280px)] mx-auto h-auto text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Gallows — always */}
      <path d="M 20 200 L 120 200" strokeWidth={3} />
      <path d="M 50 200 L 50 40 L 140 40 L 140 70" />
      <path d="M 140 70 L 140 84" className="text-muted" strokeWidth={1.5} />

      {/* Head */}
      <circle
        cx={140}
        cy={100}
        r={14}
        className={w >= 1 ? "opacity-100" : "opacity-0"}
      />
      {/* Body */}
      <path d="M 140 114 L 140 162" className={w >= 2 ? "opacity-100" : "opacity-0"} />
      {/* Left arm */}
      <path
        d="M 140 128 L 108 148"
        className={w >= 3 ? "opacity-100" : "opacity-0"}
      />
      {/* Right arm */}
      <path
        d="M 140 128 L 172 148"
        className={w >= 4 ? "opacity-100" : "opacity-0"}
      />
      {/* Legs */}
      <path
        d="M 140 162 L 112 198"
        className={w >= 5 ? "opacity-100" : "opacity-0"}
      />
      <path
        d="M 140 162 L 168 198"
        className={w >= 6 ? "opacity-100" : "opacity-0"}
      />
    </svg>
  );
}
