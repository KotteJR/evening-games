"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UnoCardBack, UnoCardFace } from "@/components/games/uno/UnoCardFace";
import { useSession } from "@/lib/session/useSession";
import { getDeviceType } from "@/lib/session/deviceType";
import type { UnoPublicState } from "@/lib/session/unoSessionReducer";
import type { UnoCard, UnoColor } from "@/lib/utils/deck";
import { canPlayCard, topDiscard } from "@/lib/games/unoLogic";

type Props = { roomCode: string; playerName: string };

function parseUnoSync(raw: unknown): {
  public: UnoPublicState;
  hand: UnoCard[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 2 || o.game !== "uno") return null;
  const pub = o.public as UnoPublicState;
  if (!pub || pub.game !== "uno") return null;
  const you = o.you as { hand?: UnoCard[] } | undefined;
  return { public: pub, hand: you?.hand ?? [] };
}

export function UnoSessionPhone({ roomCode, playerName }: Props) {
  const [pick, setPick] = useState<string | null>(null);

  const { gameState, connected, myRole, sendAction, error, connectionHint } =
    useSession({
    roomCode,
    playerName,
    deviceType: getDeviceType(),
    isHost: false,
  });

  const view = useMemo(() => parseUnoSync(gameState), [gameState]);
  const pub = view?.public;
  const hand = view?.hand ?? [];
  const role = myRole === 1 || myRole === 2 ? myRole : null;

  const faceTop = useMemo(() => {
    if (!pub) return null;
    return topDiscard(pub.discard);
  }, [pub]);
  const topForPlay = pub?.discard[pub.discard.length - 1] ?? null;

  const playCard = (card: UnoCard) => {
    if (!role) return;
    sendAction({
      game: "uno",
      action: "PLAY_CARD",
      cardId: card.id,
      player: role,
    });
    setPick(null);
  };

  const drawOne = () => {
    if (!role) return;
    sendAction({ game: "uno", action: "DRAW_CARD", player: role });
  };

  const unoCall = () => {
    if (!role) return;
    sendAction({ game: "uno", action: "UNO_CALL", player: role });
  };

  const chooseColor = (color: UnoColor) => {
    if (!role) return;
    sendAction({
      game: "uno",
      action: "CHOOSE_COLOR",
      color,
      player: role,
    });
  };

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
        <p className="font-mono text-sm text-suitred text-center">{error}</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-3 max-w-md mx-auto w-full">
        {connectionHint ? (
          <p className="font-mono text-xs text-suitred text-center leading-relaxed">
            {connectionHint}
          </p>
        ) : null}
        <p className="font-mono text-sm text-muted text-center">
          {connected ? "Assigning seat…" : "Connecting…"}
        </p>
      </div>
    );
  }

  if (!pub || pub.phase === "lobby") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-4">
        <p className="font-display text-2xl text-ink">Player {role}</p>
        <p className="font-mono text-sm text-muted text-center">
          {connected ? "Waiting for host…" : "Connecting…"}
        </p>
      </div>
    );
  }

  if (pub.phase === "gameover") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 gap-3">
        <p className="font-display text-2xl text-ink">Game over</p>
        <p className="font-mono text-xs text-muted text-center">
          Check the TV for the final score.
        </p>
      </div>
    );
  }

  const myTurn = pub.currentPlayer === role;
  const oppCount = role === 1 ? pub.handCounts[1] : pub.handCounts[0];

  const showUnoPanic = pub.unoRequiredBy === role;

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col px-4 py-6 max-w-phone mx-auto w-full gap-4">
      <header className="flex justify-between">
        <div>
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.15em]">
            Uno · P{role}
          </p>
          <p className="font-mono text-[10px] text-dim">{connected ? "Live" : "…"}</p>
        </div>
        <p className="font-mono text-[10px] text-muted">
          Opp · {oppCount} cards
        </p>
      </header>

      <div className="flex justify-center gap-6 items-start">
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[9px] text-muted">Draw</span>
          <UnoCardBack
            onClick={
              myTurn && pub.phase === "playing" ? drawOne : undefined
            }
          />
          <span className="font-mono text-[10px] text-dim">{pub.deckCount}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[9px] text-muted">Discard</span>
          {faceTop ? <UnoCardFace card={faceTop} /> : null}
        </div>
      </div>

      <p className="font-mono text-[10px] text-center text-muted">
        Color: {pub.currentColor}
        {!myTurn ? " · Waiting…" : ""}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {hand.map((c) => {
          const playable =
            myTurn &&
            pub.phase === "playing" &&
            topForPlay &&
            canPlayCard(c, topForPlay, pub.currentColor);
          return (
            <UnoCardFace
              key={c.id}
              card={c}
              selected={pick === c.id}
              onClick={() => {
                if (!playable) return;
                setPick(c.id);
                playCard(c);
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-auto">
        <Button
          variant="ghost"
          onClick={drawOne}
          disabled={!myTurn || pub.phase !== "playing"}
        >
          Draw
        </Button>
        {showUnoPanic ? (
          <Button onClick={unoCall}>UNO!</Button>
        ) : null}
      </div>

      {showUnoPanic ? (
        <p className="font-mono text-[10px] text-suitred text-center">
          Tap UNO! before playing your last card.
        </p>
      ) : null}

      <Modal
        open={pub.phase === "choosingColor" && myTurn}
        title="Choose pattern"
        onClose={() => {}}
      >
        <div className="grid grid-cols-2 gap-3">
          {(["stripes", "dots", "hatching", "solid"] as const).map((c) => (
            <Button key={c} onClick={() => chooseColor(c)}>
              {c}
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
