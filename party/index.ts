import type * as Party from "partykit/server";

type JoinPayload = {
  name: string;
  deviceType: "phone" | "desktop";
  isHost: boolean;
};

type ClientMessage =
  | { type: "JOIN"; payload: JoinPayload }
  | { type: "STATE_UPDATE"; payload: unknown }
  | { type: "PLAYER_ACTION"; payload: unknown };

export type ServerPlayer = {
  connectionId: string;
  name: string;
  role: 1 | 2 | "host";
  deviceType: "phone" | "desktop";
};

export default class NightGamesParty implements Party.Server {
  private gameState: unknown = null;
  private hostId: string | null = null;
  private players = new Map<string, ServerPlayer>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection): void {
    conn.send(
      JSON.stringify({
        type: "SYNC",
        payload: this.gameState,
      }),
    );
  }

  onMessage(message: string, sender: Party.Connection): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === "JOIN") {
      const { name, deviceType, isHost } = msg.payload;
      let role: 1 | 2 | "host";

      if (isHost) {
        if (this.hostId && this.hostId !== sender.id) {
          sender.send(
            JSON.stringify({
              type: "ERROR",
              payload: { message: "Host already connected" },
            }),
          );
          return;
        }
        this.hostId = sender.id;
        role = "host";
      } else {
        const taken = new Set(
          Array.from(this.players.values())
            .filter((p) => p.role === 1 || p.role === 2)
            .map((p) => p.role),
        );
        if (!taken.has(1)) role = 1;
        else if (!taken.has(2)) role = 2;
        else {
          sender.send(
            JSON.stringify({
              type: "ERROR",
              payload: { message: "Room full" },
            }),
          );
          return;
        }
      }

      this.players.set(sender.id, {
        connectionId: sender.id,
        name,
        role,
        deviceType,
      });

      sender.send(
        JSON.stringify({
          type: "ASSIGN",
          payload: {
            role,
            isHost: role === "host",
            connectionId: sender.id,
          },
        }),
      );

      this.broadcastPlayers();
      return;
    }

    if (msg.type === "STATE_UPDATE") {
      if (sender.id !== this.hostId) return;
      this.gameState = msg.payload;
      this.room.broadcast(
        JSON.stringify({ type: "SYNC", payload: this.gameState }),
      );
      return;
    }

    if (msg.type === "PLAYER_ACTION") {
      this.room.broadcast(message);
    }
  }

  onClose(conn: Party.Connection): void {
    this.players.delete(conn.id);
    if (conn.id === this.hostId) this.hostId = null;
    this.broadcastPlayers();
  }

  private broadcastPlayers(): void {
    const payload = Array.from(this.players.values());
    this.room.broadcast(
      JSON.stringify({ type: "PLAYERS_UPDATE", payload }),
    );
  }
}
