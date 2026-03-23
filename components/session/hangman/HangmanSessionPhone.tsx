"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session/useSession";
import type { HangmanSyncState } from "@/lib/session/hangmanSession";
import { normalizeWord } from "@/lib/games/hangman";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Props = { roomCode: string; playerName: string };

export function HangmanSessionPhone({ roomCode, playerName }: Props) {
  const [draft, setDraft] = useState("");
  const { gameState, connected, myRole, sendAction } = useSession({
    roomCode,
    playerName,
    deviceType: "phone",
    isHost: false,
  });

  const sync = gameState as HangmanSyncState | null;
  const s =
    sync && typeof sync === "object" && sync.game === "hangman" ? sync : null;

  const sendWord = () => {
    const w = normalizeWord(draft);
    if (!w.replace(/ /g, "")) return;
    sendAction({ game: "hangman", action: "SET_WORD", word: w, player: 1 });
    setDraft("");
  };

  const guess = (L: string) => {
    sendAction({ game: "hangman", action: "GUESS_LETTER", letter: L, player: 2 });
  };

  if (!connected || myRole === null) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
        <p className="font-mono text-sm text-muted">Connecting…</p>
      </div>
    );
  }

  if (myRole === "host") {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4 text-center">
        <p className="font-mono text-sm text-muted">
          Open this room on the TV / laptop host screen.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col px-4 py-8 max-w-phone mx-auto w-full">
      <header className="text-center mb-8">
        <p className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">
          {roomCode}
        </p>
        <p className="font-display text-xl mt-2">
          {myRole === 1 ? "Player 1" : "Player 2"}
        </p>
      </header>

      {!s || s.phase === "lobby" ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-muted text-center">
            Waiting for host to start…
          </p>
        </div>
      ) : null}

      {s && s.phase === "entry" && myRole === 1 ? (
        <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
          <p className="font-mono text-xs text-muted text-center uppercase tracking-[0.12em]">
            Secret word — only you see this
          </p>
          <input
            type="password"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full bg-black border border-border px-3 py-3 font-mono text-sm"
            placeholder="Word or phrase"
          />
          <Button onClick={sendWord} disabled={!draft.trim()}>
            Lock word
          </Button>
        </div>
      ) : null}

      {s && s.phase === "entry" && myRole === 2 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-muted text-center">
            Player 1 is choosing a word…
          </p>
        </div>
      ) : null}

      {s && s.phase === "guessing" && myRole === 2 ? (
        <div className="flex-1 flex flex-col space-y-6">
          <p className="font-display text-xl text-center tracking-[0.12em] break-all">
            {s.maskedDisplay}
          </p>
          <p className="font-mono text-[10px] text-center text-muted">
            Wrong {s.wrongGuesses}/{s.maxWrong}
          </p>
          <div
            className="grid grid-cols-6 gap-2"
            role="group"
            aria-label="Letters"
          >
            {LETTERS.map((L) => {
              const used = s.guessedLetters.includes(L);
              return (
                <button
                  key={L}
                  type="button"
                  disabled={used}
                  onClick={() => guess(L)}
                  className={`min-h-12 font-mono text-sm border ${
                    used
                      ? "border-border text-dim line-through"
                      : "border-border text-white hover:border-white"
                  }`}
                >
                  {L}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {s && s.phase === "guessing" && myRole === 1 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm text-muted text-center">
            Player 2 is guessing — watch the big screen.
          </p>
        </div>
      ) : null}

      {s && (s.phase === "won" || s.phase === "lost") ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
          <p className="font-display text-2xl">
            {s.phase === "won" ? "They got it!" : "Round over"}
          </p>
          {s.revealWord ? (
            <p className="font-mono text-sm text-muted">Word: {s.revealWord}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
