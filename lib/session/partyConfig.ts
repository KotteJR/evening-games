export function getPartyKitHost(): string {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";
}

export const PARTY_NAME = "nightgames";
