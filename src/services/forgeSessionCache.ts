/**
 * forgeSessionCache.ts
 *
 * Persists the last forged card (payload + layer image URLs + character-blend
 * slider position) in sessionStorage so a user can navigate away and return to
 * the Card Forge page without losing their result.  The entry is automatically
 * removed when the browser tab/session ends, or overwritten when a new card is
 * forged.
 */
import type { CardPayload } from "../lib/types";

const SESSION_KEY = "forge_session_v1";

export interface ForgeSessionData {
  card: CardPayload;
  backgroundUrl?: string;
  characterUrl?: string;
  frameUrl?: string;
  characterBlend: number;
}

/**
 * Load the last forge session from sessionStorage.
 * Returns null if nothing is stored or if the stored value cannot be parsed.
 */
export function loadForgeSession(): ForgeSessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
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
export function saveForgeSession(data: ForgeSessionData): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage may be unavailable in private-browsing or restricted contexts.
  }
}

/**
 * Remove the forge session entry from sessionStorage.
 * Silently no-ops if sessionStorage is unavailable.
 */
export function clearForgeSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
}
