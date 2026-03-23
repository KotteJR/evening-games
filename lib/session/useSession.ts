"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import type { PlayerAction, SessionMessage, SessionPlayer } from "./session.types";
import { getPartyKitHost, PARTY_NAME } from "./partyConfig";

type UseSessionOptions = {
  roomCode: string;
  playerName: string;
  deviceType: "phone" | "desktop";
  isHost: boolean;
  enabled?: boolean;
  onPlayerAction?: (action: PlayerAction) => void;
};

export function useSession({
  roomCode,
  playerName,
  deviceType,
  isHost,
  enabled = true,
  onPlayerAction,
}: UseSessionOptions) {
  const onActionRef = useRef(onPlayerAction);
  onActionRef.current = onPlayerAction;
  const socketRef = useRef<PartySocket | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [gameState, setGameState] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const [myRole, setMyRole] = useState<1 | 2 | "host" | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !roomCode) return;

    const socket = new PartySocket({
      host: getPartyKitHost(),
      party: PARTY_NAME,
      room: roomCode.toUpperCase(),
    });
    socketRef.current = socket;

    const onOpen = () => {
      setConnected(true);
      setError(null);
      socket.send(
        JSON.stringify({
          type: "JOIN",
          payload: { name: playerName, deviceType, isHost },
        } satisfies SessionMessage),
      );
    };

    const onMessage = (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(String(evt.data)) as SessionMessage;
        switch (msg.type) {
          case "SYNC":
            setGameState(msg.payload);
            break;
          case "PLAYERS_UPDATE":
            setPlayers(msg.payload);
            break;
          case "ASSIGN":
            setMyRole(msg.payload.role);
            setAssignId(msg.payload.connectionId);
            break;
          case "PLAYER_ACTION":
            onActionRef.current?.(msg.payload);
            break;
          case "ERROR":
            setError(msg.payload.message);
            break;
          default:
            break;
        }
      } catch {
        /* ignore */
      }
    };

    const onClose = () => setConnected(false);

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("close", onClose);
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode, playerName, deviceType, isHost, enabled]);

  const sendAction = useCallback((action: PlayerAction) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "PLAYER_ACTION",
        payload: action,
      } satisfies SessionMessage),
    );
  }, []);

  const pushState = useCallback((state: unknown) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "STATE_UPDATE",
        payload: state,
      } satisfies SessionMessage),
    );
  }, []);

  return {
    players,
    gameState,
    connected,
    myRole,
    assignId,
    error,
    sendAction,
    pushState,
    socket: socketRef,
  };
}
