/**
 * Converts a faction name into a safe Firestore document ID / Storage path
 * segment by lowercasing and replacing non-alphanumeric characters with
 * underscores, then collapsing repeated underscores.
 *
 * Examples:
 *   "D4rk $pider"                          → "d4rk_pider"
 *   "United Corporations of America (UCA)" → "united_corporations_of_america_uca"
 *   "Hermes' Squirmies"                    → "hermes_squirmies"
 */
export function factionSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
