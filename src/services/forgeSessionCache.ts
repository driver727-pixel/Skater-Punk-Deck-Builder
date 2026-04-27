/**
 * forgeSessionCache.ts
 *
 * Persists the last forged card (payload + layer image URLs + character-blend
 * slider position) in sessionStorage so a user can navigate away and return to
 * the Card Forge page without losing their result. Entries are scoped per auth
 * identity so signing out and back in does not expose another user's preview.
 * The entry is automatically removed when the browser tab/session ends, or
 * overwritten when a new card is forged.
 */
import type { CardPayload } from "../lib/types";

const SESSION_KEY_PREFIX = "forge_session_v1";

export interface ForgeSessionData {
  card: CardPayload;
  backgroundUrl?: string;
  characterUrl?: string;
  frameUrl?: string;
  characterBlend: number;
}

function buildSessionKey(ownerKey = "guest"): string {
  return `${SESSION_KEY_PREFIX}:${ownerKey}`;
}

/**
 * Load the last forge session from sessionStorage.
 * Returns null if nothing is stored or if the stored value cannot be parsed.
 */
export function loadForgeSession(ownerKey?: string): ForgeSessionData | null {
  try {
    const raw = sessionStorage.getItem(buildSessionKey(ownerKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ForgeSessionData;
    if (!parsed.card || typeof parsed.card !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the current forge state to sessionStorage.
 * Silently no-ops if sessionStorage is unavailable.
 */
export function saveForgeSession(data: ForgeSessionData, ownerKey?: string): void {
  try {
    sessionStorage.setItem(buildSessionKey(ownerKey), JSON.stringify(data));
  } catch {
    // sessionStorage may be unavailable in private-browsing or restricted contexts.
  }
}

/**
 * Remove the forge session entry from sessionStorage.
 * Silently no-ops if sessionStorage is unavailable.
 */
export function clearForgeSession(ownerKey?: string): void {
  try {
    sessionStorage.removeItem(buildSessionKey(ownerKey));
  } catch {
    // Ignore
  }
}
