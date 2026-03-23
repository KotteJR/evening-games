/** Inlined at build time by Next.js; empty / missing means local dev default. */
const RAW_PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

export function getPartyKitHost(): string {
  return RAW_PARTYKIT_HOST && RAW_PARTYKIT_HOST.length > 0
    ? RAW_PARTYKIT_HOST
    : "127.0.0.1:1999";
}

/** True when NEXT_PUBLIC_PARTYKIT_HOST was set for this production build. */
export function partyKitHostIsConfigured(): boolean {
  return !!(RAW_PARTYKIT_HOST && RAW_PARTYKIT_HOST.length > 0);
}

/**
 * Hosted site (e.g. Vercel) but build has no PartyKit host → phones try 127.0.0.1 and hang.
 */
export function partyKitLooksMisconfiguredForThisOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return false;
  return !partyKitHostIsConfigured();
}

/**
 * PartyKit URL segment `/parties/{PARTY_NAME}/{room}` — NOT the same as `name` in partykit.json
 * (that `name` is only the deployment subdomain). Single-party projects use `main`.
 */
export const PARTY_NAME = "main";
