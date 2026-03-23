import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

const GAMES: {
  slug: string;
  name: string;
  desc: string;
  duration: string;
}[] = [
  {
    slug: "hangman",
    name: "Hangman",
    desc: "Guess the secret word, letter by letter.",
    duration: "5–10 min",
  },
  {
    slug: "wordchain",
    name: "Word Chain",
    desc: "Last letter leads the next word.",
    duration: "5–20 min",
  },
  {
    slug: "truthordare",
    name: "Truth or Dare",
    desc: "Prompts for couples — sweet, spicy, funny.",
    duration: "10–30 min",
  },
  {
    slug: "twentyquestions",
    name: "Twenty Questions",
    desc: "Yes / no / sometimes — narrow it down.",
    duration: "15–45 min",
  },
  {
    slug: "drawandguess",
    name: "Draw & Guess",
    desc: "Sketch the prompt; partner guesses.",
    duration: "5–15 min",
  },
  {
    slug: "durak",
    name: "Durak",
    desc: "Russian attack & defend with a 36-card deck.",
    duration: "15–45 min",
  },
  {
    slug: "uno",
    name: "Uno",
    desc: "Patterns, skips, wilds — first to 500 wins.",
    duration: "15–45 min",
  },
  {
    slug: "noughtsandcrosses",
    name: "Noughts & Crosses",
    desc: "Classic, 5×5, or super meta boards.",
    duration: "5–20 min",
  },
  {
    slug: "battleship",
    name: "Battleship",
    desc: "Place your fleet, then call the shots.",
    duration: "20–40 min",
  },
  {
    slug: "wouldyourather",
    name: "Would You Rather",
    desc: "Predict your partner’s wild picks.",
    duration: "15–30 min",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col items-center px-4 py-10">
      <header className="w-full max-w-phone text-center mb-10">
        <h1 className="font-display text-[clamp(3rem,8vw,6rem)] leading-none tracking-tight">
          NIGHTGAMES
        </h1>
        <div className="mt-6 h-px w-full bg-border" />
      </header>

      <div className="w-full max-w-phone grid grid-cols-1 gap-5 pb-16">
        {GAMES.map((g) => (
          <Link
            key={g.slug}
            href={`/games/${g.slug}`}
            className="group block border border-border bg-surface-2 p-5 transition-transform duration-150 hover:border-white hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <h2 className="font-display text-2xl sm:text-3xl text-white mb-2">
              {g.name}
            </h2>
            <p className="font-mono text-xs text-muted leading-relaxed mb-4">
              {g.desc}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>2 Players</Badge>
              <Badge>{g.duration}</Badge>
            </div>
          </Link>
        ))}
      </div>

      <footer className="w-full max-w-phone border-t border-border pt-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Pass one device. Play together.
        </p>
      </footer>
    </div>
  );
}
