export const SYNC_V2 = 2 as const;

export type V2Secrets = Partial<Record<"1" | "2", Record<string, unknown>>>;

/** Host sends this; PartyKit fans out per-connection SYNC without cross-leaking secrets. */
export type SyncEnvelopeV2 = {
  v: typeof SYNC_V2;
  game: string;
  public: unknown;
  secrets?: V2Secrets;
};

/** What each client receives after personalization. */
export type ClientSyncV2<TPublic = unknown, TYou = unknown> = {
  v: typeof SYNC_V2;
  game: string;
  public: TPublic;
  /** Present for players 1 & 2; omitted for host. */
  you?: TYou;
  host?: true;
};

export function isSyncEnvelopeV2(x: unknown): x is SyncEnvelopeV2 {
  return (
    !!x &&
    typeof x === "object" &&
    (x as SyncEnvelopeV2).v === SYNC_V2 &&
    typeof (x as SyncEnvelopeV2).game === "string" &&
    "public" in (x as object)
  );
}
