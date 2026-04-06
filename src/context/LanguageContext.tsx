/**
 * LanguageContext.tsx
 * ────────────────────
 * React context that holds the currently active Craftlingua language profile.
 *
 * The profile is persisted in localStorage under the key `ps_language_profile`
 * so it survives page refreshes.  Components can call `useLanguage()` to read
 * the active vocabulary or call `loadProfile` / `clearProfile` to update it.
 */

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { CraftlinguaEnvelope, CraftlinguaWord } from "../lib/types";
import { parseCraftlinguaProfile } from "../lib/languageIngestion";

const LS_KEY = "ps_language_profile";

function loadFromStorage(): CraftlinguaEnvelope | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return parseCraftlinguaProfile(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

// ── Context shape ──────────────────────────────────────────────────────────────

interface LanguageContextValue {
  /** The currently active language profile, or null if none is loaded. */
  profile: CraftlinguaEnvelope | null;
  /** Convenience flat list of vocabulary words from the active profile. */
  vocabulary: CraftlinguaWord[];
  /** Load (and persist) a validated CraftlinguaEnvelope. */
  loadProfile: (profile: CraftlinguaEnvelope) => void;
  /** Remove the active profile from state and localStorage. */
  clearProfile: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  profile: null,
  vocabulary: [],
  loadProfile: () => {},
  clearProfile: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CraftlinguaEnvelope | null>(loadFromStorage);

  const vocabulary: CraftlinguaWord[] = profile?.vocabulary ?? [];

  const loadProfile = useCallback((p: CraftlinguaEnvelope) => {
    setProfile(p);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(p));
    } catch {
      // Silently ignore storage errors (e.g. private browsing quota).
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // Silently ignore.
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ profile, vocabulary, loadProfile, clearProfile }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  return useContext(LanguageContext);
}
