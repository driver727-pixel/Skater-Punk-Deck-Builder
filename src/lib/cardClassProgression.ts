import { DEFAULT_BOARD_CONFIG } from "../components/BoardBuilder";
import { buildForgedCard } from "./skaterBoardSynthesis";
import { createSeededRandom } from "./prng";
import type {
  AgeGroup,
  Archetype,
  BodyType,
  CardPayload,
  CardPrompts,
  District,
  FaceCharacter,
  Gender,
  HairLength,
  Rarity,
  SkinTone,
} from "./types";

export interface PlayerProgressionSnapshot {
  missionXp: number;
  missionOzzies: number;
}

export interface ForgeClassOption {
  rarity: Exclude<Rarity, "Legendary">;
  unlocked: boolean;
  unlockHint: string | null;
}

interface ClassUnlockRule {
  rarity: ForgeClassOption["rarity"];
  minXp: number;
  minOzzies: number;
}

const ARCHETYPES: Archetype[] = [
  "Qu111s",
  "Ne0n Legion",
  "Iron Curtains",
  "The Asclepians",
  "The Mesopotamian Society",
  "Hermes' Squirmies",
  "UCPS",
  "The Team",
  "The Knights Technarchy",
];
const DISTRICTS: District[] = ["Airaway", "Nightshade", "Batteryville", "The Grid", "The Forest", "Glass City"];
const GENDERS: Gender[] = ["Woman", "Man", "Non-binary"];
const AGE_GROUPS: AgeGroup[] = ["Young Adult", "Adult", "Middle-aged", "Senior"];
const BODY_TYPES: BodyType[] = ["Slim", "Athletic", "Average", "Heavy"];
const HAIR_LENGTHS: HairLength[] = ["Bald", "Short", "Medium", "Long"];
const SKIN_TONES: SkinTone[] = ["Light", "Medium", "Dark", "Very Dark"];
const FACE_CHARACTERS: FaceCharacter[] = ["Conventional", "Attractive", "Weathered", "Scarred", "Rugged"];
const ACCENT_PRESETS = ["#00ff88", "#00ccff", "#3366ff", "#ff4444", "#ffaa00", "#8b5cf6", "#ff66cc"];

export const LEGENDARY_FORGE_NOTICE = "Legendary cards are not forgeable.";
export const FORGE_CLASS_RULES: readonly ClassUnlockRule[] = [
  { rarity: "Punch Skater", minXp: 0, minOzzies: 0 },
  { rarity: "Apprentice", minXp: 80, minOzzies: 40 },
  { rarity: "Master", minXp: 220, minOzzies: 110 },
  { rarity: "Rare", minXp: 480, minOzzies: 240 },
] as const;

function normalizeProgressionValue(value: number | undefined): number {
  return Math.max(0, Number(value) || 0);
}

function getUnlockRule(rarity: ForgeClassOption["rarity"]): ClassUnlockRule {
  return FORGE_CLASS_RULES.find((rule) => rule.rarity === rarity) ?? FORGE_CLASS_RULES[0];
}

export function isForgeClassUnlocked(
  rarity: ForgeClassOption["rarity"],
  progression: PlayerProgressionSnapshot,
): boolean {
  const rule = getUnlockRule(rarity);
  const missionXp = normalizeProgressionValue(progression.missionXp);
  const missionOzzies = normalizeProgressionValue(progression.missionOzzies);
  return rule.minXp === 0 || missionXp >= rule.minXp || missionOzzies >= rule.minOzzies;
}

export function getForgeClassOptions(progression: PlayerProgressionSnapshot): ForgeClassOption[] {
  return FORGE_CLASS_RULES.map((rule) => ({
    rarity: rule.rarity,
    unlocked: isForgeClassUnlocked(rule.rarity, progression),
    unlockHint: rule.minXp === 0
      ? null
      : `Unlock with ${rule.minXp} XP or ${rule.minOzzies} Ozzies.`,
  }));
}

export function normalizeForgeRarity(
  rarity: Rarity,
  progression: PlayerProgressionSnapshot,
): ForgeClassOption["rarity"] {
  if (rarity !== "Legendary" && isForgeClassUnlocked(rarity, progression)) {
    return rarity;
  }
  const unlockedOptions = getForgeClassOptions(progression).filter((option) => option.unlocked);
  return unlockedOptions[unlockedOptions.length - 1]?.rarity ?? "Punch Skater";
}

function pick<T>(rng: ReturnType<typeof createSeededRandom>, values: readonly T[]): T {
  return rng.pick(values as T[]);
}

export function buildSignupBonusCard(uid: string): CardPayload {
  const rng = createSeededRandom(`signup-bonus:${uid}`);
  const prompts: CardPrompts = {
    archetype: pick(rng, ARCHETYPES),
    rarity: "Rare",
    style: "Street",
    district: pick(rng, DISTRICTS),
    accentColor: pick(rng, ACCENT_PRESETS),
    gender: pick(rng, GENDERS),
    ageGroup: pick(rng, AGE_GROUPS),
    bodyType: pick(rng, BODY_TYPES),
    hairLength: pick(rng, HAIR_LENGTHS),
    skinTone: pick(rng, SKIN_TONES),
    faceCharacter: pick(rng, FACE_CHARACTERS),
  };

  return buildForgedCard({
    prompts,
    boardConfig: DEFAULT_BOARD_CONFIG,
    idNonce: `signup-bonus:${uid}`,
  });
}
