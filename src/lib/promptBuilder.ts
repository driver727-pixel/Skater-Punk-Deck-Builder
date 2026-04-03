import type { CardPrompts } from "./types";

// ── Lookup tables ──────────────────────────────────────────────────────────────

const DISTRICT_DESCRIPTIONS: Record<string, string> = {
  Airaway:      "a floating sky city with clouds and levitating platforms",
  Nightshade:   "a rain-drenched neon-lit cyberpunk megalopolis at night",
  Batteryville: "a rugged off-grid desert settlement with solar panels and wind turbines",
};

const STYLE_CLOTHING: Record<string, string> = {
  Corporate:  "a sleek corporate suit with a high-tech earpiece",
  Street:     "a street-style hoodie and cargo pants with graffiti patches",
  "Off-grid": "rugged off-grid survivalist gear with utility belts",
  Military:   "tactical military fatigues with body armour",
  Union:      "union worker overalls covered in badge patches",
};

const ARCHETYPE_POSES: Record<string, string> = {
  "Ninja":        "crouched in a stealthy ready stance",
  "Punk Rocker":  "striking a defiant rock-star pose with arms wide",
  "Ex Military":  "standing at confident attention with arms crossed",
  "Hacker":       "typing on a holographic keyboard, screens reflected in goggles",
  "Chef":         "brandishing a cleaver and a spray-can like weapons",
};

const VIBE_BOARD: Record<string, string> = {
  Grunge:  "a worn, weathered",
  Neon:    "a glowing neon",
  Chrome:  "a sleek chrome",
  Plastic: "a bright colourful plastic",
};

const RARITY_MOOD: Record<string, string> = {
  "Punch Skater": "gritty and low-budget",
  Apprentice:     "energetic and hopeful",
  Master:         "confident and polished",
  Rare:           "dynamic and striking",
  Legendary:      "epic, otherworldly, and awe-inspiring",
};

// ── Prompt builder ─────────────────────────────────────────────────────────────

/**
 * Converts a set of card prompts into a descriptive text prompt suitable for
 * an AI image generation model such as Fal.ai FLUX.1.
 *
 * The same card prompts always produce exactly the same string, so
 * reproducibility is maintained when paired with the hashed integer seed from
 * `hashSeedToInt(masterSeed)`.
 */
export function buildImagePrompt(prompts: CardPrompts): string {
  const clothing  = STYLE_CLOTHING[prompts.style]    ?? prompts.style;
  const pose      = ARCHETYPE_POSES[prompts.archetype] ?? prompts.archetype;
  const district  = DISTRICT_DESCRIPTIONS[prompts.district] ?? prompts.district;
  const board     = VIBE_BOARD[prompts.vibe]          ?? prompts.vibe;
  const mood      = RARITY_MOOD[prompts.rarity]       ?? "bold";

  return (
    `A hyper-realistic 3D cartoon-style portrait of a ${prompts.archetype} skater ` +
    `wearing ${clothing}, ${pose}, riding ${board} skateboard. ` +
    `The background is ${district}. ` +
    `Mood: ${mood}. Stamina level ${prompts.stamina} out of 10 — ` +
    (prompts.stamina <= 3
      ? "visibly tired, carrying minimal gear."
      : prompts.stamina >= 8
        ? "fully loaded, carrying bulky cargo."
        : "alert and ready, mid-weight gear.") +
    " Rendered in Unreal Engine, vibrant colours, octane render, cinematic lighting, 4K."
  );
}
