"use client";

import type { DurakCard, Suit } from "@/lib/utils/deck";

export interface PlayingCardProps {
  card: DurakCard | null;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const sz = { sm: "w-[60px] h-[84px]", md: "w-20 h-28", lg: "w-[100px] h-[140px]" };

function suitClass(s: Suit) {
  return s === "♥" || s === "♦" ? "text-suitred" : "text-black";
}

export function PlayingCard({
  card,
  selected,
  onClick,
  size = "md",
}: PlayingCardProps) {
  const base = `${sz[size]} rounded-brand border border-[#2A2A2A] shrink-0 flex flex-col justify-between p-1 cursor-pointer select-none transition-shadow bg-card text-black`;
  const sel = selected ? "shadow-[0_0_0_2px_#fff]" : "";

  if (!card) {
    return (
      <button
        type="button"
        aria-label="Face-down card"
        onClick={onClick}
        className={`${base} ${sel} bg-black text-white items-center justify-center`}
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #fff 0 2px,
            transparent 2px 8px
          )`,
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${sel} font-mono`}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span className={`text-left text-[10px] leading-none ${suitClass(card.suit)}`}>
        <span className="block font-semibold">{card.rank}</span>
        <span className="block">{card.suit}</span>
      </span>
      <span
        className={`text-right text-[10px] leading-none self-end ${suitClass(card.suit)}`}
      >
        <span className="block">{card.suit}</span>
        <span className="block font-semibold">{card.rank}</span>
      </span>
    </button>
  );
}
