import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "ambience-enabled";
const AMBIENCE_SRC = "/assets/sounds/buzzing crt.mp3";

/**
 * Manages the looping CRT-buzzing background ambience.
 * The enabled state is persisted to localStorage so it survives page reloads.
 * Returns [enabled, toggle].
 */
export function useAmbience(): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialise the audio element once.
  useEffect(() => {
    const audio = new Audio(AMBIENCE_SRC);
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // React to enabled changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      audio.play().catch(() => {/* autoplay policy – silently ignored */});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      /* storage unavailable */
    }
  }, [enabled]);

  const toggle = () => setEnabled((v) => !v);

  return [enabled, toggle];
}
