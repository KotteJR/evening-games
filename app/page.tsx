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
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-16 pt-16 sm:px-8 sm:pt-20">
        <header className="mb-10 w-full text-center sm:mb-14">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.05] tracking-tight text-balance text-ink">
            Evening Games
          </h1>
          <p className="mx-auto mt-4 max-w-md font-mono text-xs text-muted leading-relaxed">
            For two — pass one device or use a TV and phones.
          </p>
          <div className="mx-auto mt-8 h-px w-full max-w-sm bg-border" />
        </header>

        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              href={`/games/${g.slug}`}
              className="group flex h-full flex-col rounded-brand-lg border border-border bg-surface-2 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset sm:p-6"
            >
              <h2 className="mb-2 font-display text-2xl text-ink sm:text-3xl">
                {g.name}
              </h2>
              <p className="mb-4 flex-1 font-mono text-xs text-muted leading-relaxed">
                {g.desc}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Badge>2 Players</Badge>
                <Badge>{g.duration}</Badge>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mx-auto mt-14 w-full max-w-4xl border-t border-border pt-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Pass one device. Play together.
          </p>
        </footer>
      </div>
    </div>
  );
}
