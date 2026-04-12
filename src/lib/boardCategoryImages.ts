/**
 * boardCategoryImages.ts
 *
 * Discovers all PNG images committed to the per-category board asset folders
 * under `src/assets/boards/` at build time via Vite's `import.meta.glob`.
 *
 * How to add images:
 *   1. Drop any `.png` file into the matching category folder:
 *        src/assets/boards/motor/        ← motor photos
 *        src/assets/boards/deck/         ← deck photos
 *        src/assets/boards/drivetrain/   ← drivetrain photos
 *        src/assets/boards/wheels/       ← wheel photos
 *        src/assets/boards/battery/      ← battery photos
 *   2. Commit the file and rebuild — Vite will automatically pick it up.
 *
 * File names do NOT need to match option values; any `.png` name is fine.
 * The app will randomly select one image from the appropriate folder to
 * display in the BoardPreviewGrid composition box for visual immersion.
 *
 * Note: Files placed in `public/assets/boards/<category>/` with names that
 * exactly match the option value (e.g. `Standard.png`) are served directly
 * by the browser and will be shown by the Tile component as a first-choice
 * URL.  The glob-based random selection from `src/assets/boards/` acts as the
 * discovery layer for any filenames that don't follow that convention.
 */

// ── Build-time image discovery (Vite import.meta.glob) ────────────────────────
// Each glob returns Record<filePath, defaultExport> where the default export
// for a PNG is the hashed public URL produced by Vite.

const deckGlob = import.meta.glob<string>(
  "../assets/boards/deck/*.png",
  { eager: true, import: "default" },
);

const drivetrainGlob = import.meta.glob<string>(
  "../assets/boards/drivetrain/*.png",
  { eager: true, import: "default" },
);

const motorGlob = import.meta.glob<string>(
  "../assets/boards/motor/*.png",
  { eager: true, import: "default" },
);

const wheelsGlob = import.meta.glob<string>(
  "../assets/boards/wheels/*.png",
  { eager: true, import: "default" },
);

const batteryGlob = import.meta.glob<string>(
  "../assets/boards/battery/*.png",
  { eager: true, import: "default" },
);

// ── Category image maps ────────────────────────────────────────────────────────

const CATEGORY_IMAGE_URLS = {
  deck:       Object.values(deckGlob),
  drivetrain: Object.values(drivetrainGlob),
  motor:      Object.values(motorGlob),
  wheels:     Object.values(wheelsGlob),
  battery:    Object.values(batteryGlob),
} as const satisfies Record<string, string[]>;

export type BoardCategory = keyof typeof CATEGORY_IMAGE_URLS;

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Returns all discovered image URLs for the given board component category.
 * Returns an empty array when no images have been uploaded to that folder yet.
 */
export function getCategoryImages(category: BoardCategory): readonly string[] {
  return CATEGORY_IMAGE_URLS[category];
}

/**
 * Picks a random image URL from the given board component category.
 * Returns `null` when the folder contains no images.
 */
export function getRandomCategoryImage(category: BoardCategory): string | null {
  const imgs = CATEGORY_IMAGE_URLS[category];
  if (imgs.length === 0) return null;
  return imgs[Math.floor(Math.random() * imgs.length)];
}
