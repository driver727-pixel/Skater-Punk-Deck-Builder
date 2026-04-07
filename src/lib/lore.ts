import { Faction, Manufacturer, Archetype, Vibe } from './types';

export const LORE_CHARACTER_NAMES = ["Skip 'Skids' Mayhew", "Ketch", "Cyber Jeff", "Quill-01", "Neon Stalker"];

export const ARCHETYPE_TO_FACTION: Record<Archetype, Faction> = {
  "Ninja": "The Knights Technarchy",
  "Punk Rocker": "Punch Skaters",
  "Ex Military": "Iron Curtains",
  "Hacker": "D4rk $pider",
  "Chef": "UCPS Workers",
  "Olympic": "United Corporations of America (UCA)",
  "Fash": "The Asclepians"
};

export const VIBE_TO_MANUFACTURER: Record<Vibe, Manufacturer> = {
  "Grunge": "DIY/Plywood",
  "Neon": "VoidRacer",
  "Chrome": "Dark Light Labs",
  "Plastic": "UCA",
  "Recycled": "The Wooders"
};

export const LORE_PASSIVE_TRAITS = [
  { name: "Gutter Punk Resilience", description: "Gain +1 Armor when below 50% HP." },
  { name: "Luddite's Balance", description: "+2 to Grinding on wood decks." }
];

export const LORE_ACTIVE_ABILITIES = [
  { name: "Broomstick Sabotage", description: "Instant wipeout for UCA White Bikes." },
  { name: "Turbo Boost", description: "Triple Speed; take 1 damage." }
];
