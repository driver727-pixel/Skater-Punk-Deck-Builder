import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface FactionImageEntry {
  factionName: string;
  imageUrl: string;
}

/** Returns a map of faction slug → image URL, updated in real time. */
export function useFactionImages(): Map<string, string> {
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(collection(db, "factionImages"), (snap) => {
      const entries = new Map<string, string>();
      snap.forEach((doc) => {
        const data = doc.data();
        if (typeof data.imageUrl === "string" && data.imageUrl) {
          entries.set(doc.id, data.imageUrl);
        }
      });
      setImageMap(entries);
    });

    return unsub;
  }, []);

  return imageMap;
}
