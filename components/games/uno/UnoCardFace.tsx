"use client";

import type { CSSProperties } from "react";
import type { UnoCard, UnoColor } from "@/lib/utils/deck";

const pattern: Record<Exclude<UnoColor, "wild">, CSSProperties> = {
  stripes: {
    backgroundImage: `repeating-linear-gradient(
      0deg,
      #000 0 2px,
      transparent 2px 7px
    )`,
  },
  dots: {
    backgroundImage: `radial-gradient(circle, #000 1.5px, transparent 1.6px)`,
    backgroundSize: "8px 8px",
  },
  hatching: {
    backgroundImage: `repeating-linear-gradient(
      45deg,
      #000 0 1px,
      transparent 1px 6px
    ), repeating-linear-gradient(
      -45deg,
      #000 0 1px,
      transparent 1px 6px
    )`,
  },
  solid: {
    backgroundColor: "#111",
  },
};

function label(v: UnoCard["value"]): string {
  switch (v) {
    case "skip":
      return "⊘";
    case "reverse":
      return "↺";
    case "draw2":
      return "+2";
    case "wild":
      return "★";
    case "wild4":
      return "★+4";
    default:
      return v;
  }
}

type Props = {
  card: UnoCard;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
};

export function UnoCardFace({ card, selected, small, onClick }: Props) {
  const isWild = card.color === "wild";
  const base =
    "relative rounded-brand border border-[#2A2A2A] bg-card text-black overflow-hidden flex flex-col items-center justify-center font-mono select-none";
  const sz = small ? "w-14 h-20 text-sm" : "w-[72px] h-[102px] text-lg";
  const sel = selected ? "shadow-[0_0_0_2px_#fff]" : "";

  const bgStyle: CSSProperties = isWild
    ? {
        background:
          "conic-gradient(from 0deg, #fff 0 25%, #000 25% 50%, #fff 50% 75%, #000 75% 100%)",
      }
    : pattern[card.color as Exclude<UnoColor, "wild">];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${sz} ${sel}`}
      aria-label={`Uno ${card.color} ${card.value}`}
    >
      <span
        className="absolute inset-1 rounded-sm opacity-90"
        style={bgStyle}
      />
      <span className="relative z-[1] font-bold mix-blend-difference text-white drop-shadow-[0_0_1px_#000]">
        {label(card.value)}
      </span>
    </button>
  );
}

export function UnoCardBack({ small, onClick }: { small?: boolean; onClick?: () => void }) {
  const sz = small ? "w-14 h-20" : "w-[72px] h-[102px]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Uno card back"
      className={`${sz} rounded-brand shrink-0 border border-border bg-surface`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          var(--text) 0 2px,
          transparent 2px 9px
        )`,
      }}
    />
  );
}
