"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SessionQR } from "@/components/session/SessionQR";
import { HangmanFigure } from "@/components/games/hangman/HangmanFigure";
import { useSession } from "@/lib/session/useSession";
import type { PlayerAction } from "@/lib/session/session.types";
import type { HangmanSyncState } from "@/lib/session/hangmanSession";
import { initialHangmanSync } from "@/lib/session/hangmanSession";
import { isWin, maskWord, normalizeWord } from "@/lib/games/hangman";

type Props = { roomCode: string };

export function HangmanSessionHost({ roomCode }: Props) {
  const secretRef = useRef("");
  const pushRef = useRef<(s: unknown) => void>(() => {});
  const [sync, setSync] = useState<HangmanSyncState>(initialHangmanSync());
  const [started, setStarted] = useState(false);

  const applyGuess = useCallback(
    (letter: string, word: string, prev: HangmanSyncState): HangmanSyncState => {
      const g = new Set(prev.guessedLetters);
      if (g.has(letter)) return prev;
      const nextGuessed = [...prev.guessedLetters, letter];
      const g2 = new Set(nextGuessed);
      const inWord = word.includes(letter);
      const wrong = inWord ? prev.wrongGuesses : prev.wrongGuesses + 1;
      let phase = prev.phase;
      if (!inWord && wrong >= prev.maxWrong) phase = "lost";
      else if (isWin(word, g2)) phase = "won";
      const masked = maskWord(word, g2);
      return {
        ...prev,
        phase,
        guessedLetters: nextGuessed,
        wrongGuesses: wrong,
        maskedDisplay: masked,
        revealWord: phase === "won" || phase === "lost" ? word : undefined,
      };
    },
    [],
  );

  const onPlayerAction = useCallback(
    (action: PlayerAction) => {
      if (action.game !== "hangman") return;
      if (action.action === "SET_WORD") {
        const w = normalizeWord(action.word);
        if (!w.replace(/ /g, "")) return;
        secretRef.current = w;
        setSync((prev) => {
          const next: HangmanSyncState = {
            ...prev,
            phase: "guessing",
            guessedLetters: [],
            wrongGuesses: 0,
            maskedDisplay: maskWord(w, new Set()),
          };
          pushRef.current(next);
          return next;
        });
        return;
      }
      if (action.action === "GUESS_LETTER") {
        const word = secretRef.current;
        if (!word) return;
        setSync((prev) => {
          if (prev.phase !== "guessing") return prev;
          const L = action.letter.toUpperCase();
          if (!/^[A-Z]$/.test(L)) return prev;
          const next = applyGuess(L, word, prev);
          pushRef.current(next);
          return next;
        });
      }
    },
    [applyGuess],
  );

  const { players, gameState, connected, pushState } = useSession({
    roomCode,
    playerName: "TV",
    deviceType: "desktop",
    isHost: true,
    onPlayerAction,
  });

  pushRef.current = pushState;

  useEffect(() => {
    if (
      gameState &&
      typeof gameState === "object" &&
      (gameState as HangmanSyncState).game === "hangman"
    ) {
      setSync(gameState as HangmanSyncState);
    }
  }, [gameState]);

  const hasTwo =
    players.filter((p) => p.role === 1 || p.role === 2).length >= 2;

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(
      `${window.location.origin}/join/${encodeURIComponent(roomCode)}`,
    );
    u.searchParams.set("game", "hangman");
    return u.toString();
  }, [roomCode]);

  const startEntry = () => {
    const next: HangmanSyncState = {
      ...initialHangmanSync(),
      game: "hangman",
      phase: "entry",
      maskedDisplay: "",
    };
    setSync(next);
    pushState(next);
    setStarted(true);
  };

  const rematch = () => {
    secretRef.current = "";
    const next: HangmanSyncState = {
      ...initialHangmanSync(),
      game: "hangman",
      phase: "entry",
      maskedDisplay: "",
    };
    setSync(next);
    pushState(next);
  };

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-white"
        >
          ← Menu
        </Link>
        <h1 className="font-display text-lg text-white">Hangman · {roomCode}</h1>
        <span
          className={`font-mono text-[10px] ${connected ? "text-white" : "text-suitred"}`}
        >
          {connected ? "Live" : "…"}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-2xl mx-auto">
        {!started && sync.phase === "lobby" ? (
          <div className="text-center space-y-6 w-full max-w-md flex flex-col items-center">
            {joinUrl ? <SessionQR url={joinUrl} label="Phones join here" /> : null}
            {joinUrl ? (
              <p className="font-mono text-[10px] text-dim break-all px-2">{joinUrl}</p>
            ) : null}
            <p className="font-mono text-xs text-muted">
              {players.map((p) => `${p.name} (${p.role})`).join(" · ") ||
                "Waiting for phones…"}
            </p>
            <Button onClick={startEntry} disabled={!hasTwo || !connected}>
              Start — word on Player 1&apos;s phone
            </Button>
          </div>
        ) : null}

        {(sync.phase === "entry" ||
          sync.phase === "guessing" ||
          sync.phase === "won" ||
          sync.phase === "lost") &&
        started ? (
          <div className="w-full space-y-8 flex flex-col items-center">
            <p className="font-display text-2xl sm:text-3xl tracking-[0.15em] text-center break-all max-w-full">
              {sync.maskedDisplay || "······"}
            </p>
            <HangmanFigure wrong={sync.wrongGuesses} />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Wrong: {sync.wrongGuesses} / {sync.maxWrong}
            </p>
            {sync.phase === "entry" ? (
              <p className="font-mono text-sm text-muted text-center">
                Player 1: enter the secret word on your phone.
              </p>
            ) : null}
            {sync.phase === "guessing" ? (
              <p className="font-mono text-sm text-muted text-center">
                Player 2: guess letters on your phone.
              </p>
            ) : null}
            {(sync.phase === "won" || sync.phase === "lost") && sync.revealWord ? (
              <div className="text-center space-y-4">
                <p className="font-display text-2xl">
                  {sync.phase === "won" ? "Player 2 wins" : "Round lost"}
                </p>
                <p className="font-mono text-sm text-muted">
                  Word: {sync.revealWord}
                </p>
                <Button onClick={rematch}>Again</Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
