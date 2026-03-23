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

type EnvelopeV2 = {
  v: 2;
  game: string;
  public: unknown;
  secrets?: Partial<Record<"1" | "2", Record<string, unknown>>>;
};

function isEnvelopeV2(x: unknown): x is EnvelopeV2 {
  return (
    !!x &&
    typeof x === "object" &&
    (x as EnvelopeV2).v === 2 &&
    typeof (x as EnvelopeV2).game === "string" &&
    "public" in (x as object)
  );
}

function personalizeSync(
  env: EnvelopeV2,
  role: 1 | 2 | "host" | undefined,
): unknown {
  const base = { v: 2 as const, game: env.game, public: env.public };
  if (role === "host") {
    return { ...base, host: true };
  }
  if (role === 1 && env.secrets?.["1"]) {
    return { ...base, you: env.secrets["1"] };
  }
  if (role === 2 && env.secrets?.["2"]) {
    return { ...base, you: env.secrets["2"] };
  }
  return base;
}

export default class NightGamesParty implements Party.Server {
  private envelopeV2: EnvelopeV2 | null = null;
  private legacyState: unknown = null;
  private hostId: string | null = null;
  private players = new Map<string, ServerPlayer>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection): void {
    this.sendSyncTo(conn);
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
      this.sendSyncTo(sender);
      return;
    }

    if (msg.type === "STATE_UPDATE") {
      if (sender.id !== this.hostId) return;
      const p = msg.payload;
      if (isEnvelopeV2(p)) {
        this.envelopeV2 = p;
        this.legacyState = null;
        this.broadcastPersonalizedSync();
        return;
      }
      this.legacyState = p;
      this.envelopeV2 = null;
      this.room.broadcast(JSON.stringify({ type: "SYNC", payload: p }));
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

  private sendSyncTo(conn: Party.Connection): void {
    const role = this.players.get(conn.id)?.role;
    if (this.envelopeV2) {
      conn.send(
        JSON.stringify({
          type: "SYNC",
          payload: personalizeSync(this.envelopeV2, role),
        }),
      );
      return;
    }
    conn.send(
      JSON.stringify({ type: "SYNC", payload: this.legacyState }),
    );
  }

  private broadcastPersonalizedSync(): void {
    if (!this.envelopeV2) return;
    for (const conn of this.room.getConnections()) {
      const role = this.players.get(conn.id)?.role;
      conn.send(
        JSON.stringify({
          type: "SYNC",
          payload: personalizeSync(this.envelopeV2, role),
        }),
      );
    }
  }
}

export const onFetch = (): Response => new Response("NightGames Party");
