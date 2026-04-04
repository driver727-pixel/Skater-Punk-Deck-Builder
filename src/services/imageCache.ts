import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const COLLECTION = "imageCache";

/**
 * Sanitise a seed string so it can be used as a Firestore document ID.
 * Firestore IDs must not contain '/', must not be '.' or '..', and are
 * capped at 1,500 bytes. Our seeds never come close to this limit but we
 * guard anyway.
 */
function encodeKey(key: string): string {
  const sanitized = key.replace(/\//g, "_");
  // Firestore disallows the literal IDs '.' and '..'
  if (sanitized === "." || sanitized === "..") return `_${sanitized}`;
  // Enforce the 1,500-byte document-ID ceiling
  return sanitized.slice(0, 1500);
}

/**
 * Returns a cached image URL for the given cache key, or null if not cached.
 * Errors are swallowed so a cache miss never blocks generation.
 */
export async function getCachedImage(cacheKey: string): Promise<string | null> {
  try {
    const ref = doc(db, COLLECTION, encodeKey(cacheKey));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const url = (snap.data() as { imageUrl?: string }).imageUrl;
      return url ?? null;
    }
  } catch (err) {
    console.warn("Image cache read failed:", err);
  }
  return null;
}

/**
 * Stores a generated image URL in the cache under the given key.
 * Errors are swallowed so a write failure never breaks the UI.
 * The Firestore security rule allows `create` but not `update`, so this is
 * effectively a write-once store — concurrent writes for the same key are
 * harmless because the second write is silently rejected.
 */
export async function setCachedImage(
  cacheKey: string,
  imageUrl: string,
): Promise<void> {
  try {
    const ref = doc(db, COLLECTION, encodeKey(cacheKey));
    await setDoc(ref, { imageUrl, createdAt: serverTimestamp() }, { merge: false });
  } catch (err) {
    // Non-critical — may fail if another user already populated this entry
    console.warn("Image cache write failed:", err);
  }
}
