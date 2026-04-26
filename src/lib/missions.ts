import { getDistrictAccessSummary, isDistrictAccessibleWithBoardType, type DistrictWeatherSnapshot } from "./districtWeather";
import type {
  MissionBoardEntry,
  MissionDeckEvaluation,
  MissionRequirement,
  MissionRequirementResult,
} from "./sharedTypes";
import type { DeckPayload, District } from "./types";

type MissionTemplate = Omit<
  MissionBoardEntry,
  | "id"
  | "uid"
  | "system"
  | "schemaVersion"
  | "status"
  | "progress"
  | "target"
  | "createdAt"
  | "updatedAt"
>;

export const MISSION_BOARD_DEFINITIONS: MissionTemplate[] = [
  {
    definitionId: "batteryville-breaker-yard",
    sortOrder: 0,
    title: "Breaker Yard Relay",
    tagline: "Shift freight through Batteryville without losing your axle.",
    description:
      "Batteryville only respects decks that can absorb punishment. Bring a full squad, keep your line moving, and prove your couriers can survive the scrapyard lanes.",
    district: "Batteryville",
    rewardXp: 180,
    rewardOzzies: 90,
    requirements: [
      { type: "min_cards", label: "Bring a full six-card deck.", count: 6 },
      { type: "district_access", label: "At least 2 couriers can enter Batteryville.", count: 2, district: "Batteryville" },
      { type: "district_card", label: "Include 1 Batteryville local in the deck.", count: 1, district: "Batteryville" },
      { type: "stat_total", label: "Reach 28 total Grit across the deck.", count: 28, stat: "grit" },
    ],
  },
  {
    definitionId: "nightshade-tunnel-run",
    sortOrder: 1,
    title: "Nightshade Tunnel Run",
    tagline: "Quiet wheels, clean shadows, no witnesses.",
    description:
      "The Murk doesn't care about brute force. It rewards couriers who can ride rough access lines, stay hidden, and finish the drop before the tunnel crews notice.",
    district: "Nightshade",
    rewardXp: 190,
    rewardOzzies: 110,
    requirements: [
      { type: "min_cards", label: "Bring a full six-card deck.", count: 6 },
      { type: "district_access", label: "At least 2 couriers can enter Nightshade.", count: 2, district: "Nightshade" },
      { type: "stat_total", label: "Reach 28 total Stealth across the deck.", count: 28, stat: "stealth" },
    ],
  },
  {
    definitionId: "airaway-sky-lane",
    sortOrder: 2,
    title: "Airaway Sky-Lane",
    tagline: "Only street-quiet rigs make it through the checkpoint glass.",
    description:
      "Airaway chews up loud hardware. Build a clean, fast deck with enough street-wheel couriers to get through the scanners before the corp towers close the route.",
    district: "Airaway",
    rewardXp: 170,
    rewardOzzies: 85,
    requirements: [
      { type: "min_cards", label: "Bring a full six-card deck.", count: 6 },
      { type: "wheel_type", label: "Run at least 2 street-wheel couriers.", count: 2, wheelTypes: ["Urethane"] },
      { type: "district_access", label: "At least 1 courier can enter Airaway.", count: 1, district: "Airaway" },
      { type: "stat_total", label: "Reach 24 total Speed across the deck.", count: 24, stat: "speed" },
    ],
  },
  {
    definitionId: "grid-trace",
    sortOrder: 3,
    title: "Grid Trace Job",
    tagline: "Cascade's cameras never blink. Your deck shouldn't either.",
    description:
      "The Grid is a surveillance maze. Run a fast stack with at least one Technarchy operative and enough district-ready hardware to stay ahead of the trace.",
    district: "The Grid",
    rewardXp: 220,
    rewardOzzies: 125,
    requirements: [
      { type: "min_cards", label: "Bring a full six-card deck.", count: 6 },
      { type: "district_access", label: "At least 2 couriers can enter The Grid.", count: 2, district: "The Grid" },
      { type: "archetype", label: "Include 1 Knights Technarchy courier.", count: 1, archetype: "The Knights Technarchy" },
      { type: "stat_total", label: "Reach 30 total Speed across the deck.", count: 30, stat: "speed" },
    ],
  },
  {
    definitionId: "forest-rootline",
    sortOrder: 4,
    title: "Rootline Extraction",
    tagline: "Bring rough-route wheels or leave the package in the roots.",
    description:
      "The Forest only opens to decks built for root bridges and wet timber lanes. If your riders can't bite into the route, the job dies before it starts.",
    district: "The Forest",
    rewardXp: 210,
    rewardOzzies: 120,
    requirements: [
      { type: "min_cards", label: "Bring a full six-card deck.", count: 6 },
      { type: "wheel_type", label: "Run at least 2 rough-route wheel setups.", count: 2, wheelTypes: ["Pneumatic", "Rubber"] },
      { type: "district_access", label: "At least 2 couriers can enter The Forest.", count: 2, district: "The Forest" },
      { type: "district_card", label: "Include 1 Forest local in the deck.", count: 1, district: "The Forest" },
    ],
  },
  {
    definitionId: "glass-city-exchange",
    sortOrder: 5,
    title: "Glass City Exchange",
    tagline: "Any wheel can enter. Not every deck can finish the route.",
    description:
      "Glass City is open territory, which means everyone wants the payout. Bring enough ride-ready couriers and the range to finish the exchange before a rival cuts in.",
    district: "Glass City",
    rewardXp: 160,
    rewardOzzies: 80,
    requirements: [
      { type: "min_cards", label: "Bring a full six-card deck.", count: 6 },
      { type: "district_access", label: "At least 3 couriers can enter Glass City.", count: 3, district: "Glass City" },
      { type: "district_card", label: "Include 1 Glass City local in the deck.", count: 1, district: "Glass City" },
      { type: "stat_total", label: "Reach 28 total Range across the deck.", count: 28, stat: "range" },
    ],
  },
];

function getRequirementTarget(requirement: MissionRequirement): number {
  return requirement.count ?? 0;
}

function getCardsMatchingDistrictAccess(
  deck: DeckPayload,
  district: District,
  weatherByDistrict: Partial<Record<District, DistrictWeatherSnapshot | null>>,
): number {
  const weather = weatherByDistrict[district] ?? null;
  return deck.cards.filter((card) =>
    isDistrictAccessibleWithBoardType(
      district,
      weather,
      card.board.config.boardType,
      card.board.config.wheels,
    ),
  ).length;
}

function buildRequirementResult(
  requirement: MissionRequirement,
  current: number,
  detail: string,
): MissionRequirementResult {
  const needed = getRequirementTarget(requirement);
  return {
    requirement,
    met: current >= needed,
    current,
    needed,
    detail,
  };
}

export function getMissionRequirementBadge(requirement: MissionRequirement): string {
  switch (requirement.type) {
    case "district_access":
      return `📍 ${requirement.district}`;
    case "wheel_type":
      return `⚫ ${(requirement.wheelTypes ?? []).join(" / ")}`;
    case "stat_total":
      return `📊 ${requirement.stat} ${requirement.count}`;
    case "archetype":
      return `🎭 ${requirement.archetype}`;
    case "faction":
      return `🏴 ${requirement.faction}`;
    case "district_card":
      return `🧭 ${requirement.district} local`;
    case "min_cards":
      return `🗂️ ${requirement.count} cards`;
  }
}

export function getMissionStateLabel(mission: MissionBoardEntry): string {
  return mission.status === "completed" ? "Complete" : "Available";
}

export function getMissionWeatherSummary(
  mission: MissionBoardEntry,
  weatherByDistrict: Partial<Record<District, DistrictWeatherSnapshot | null>>,
): string {
  return getDistrictAccessSummary(mission.district, weatherByDistrict[mission.district] ?? null);
}

export function evaluateMissionDeck(
  deck: DeckPayload,
  mission: MissionBoardEntry,
  weatherByDistrict: Partial<Record<District, DistrictWeatherSnapshot | null>> = {},
): MissionDeckEvaluation {
  const results = mission.requirements.map((requirement) => {
    switch (requirement.type) {
      case "min_cards": {
        const current = deck.cards.length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} cards ready for the run.`,
        );
      }
      case "district_access": {
        const district = requirement.district ?? mission.district;
        const current = getCardsMatchingDistrictAccess(deck, district, weatherByDistrict);
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} couriers can currently enter ${district}.`,
        );
      }
      case "wheel_type": {
        const allowedWheelTypes = requirement.wheelTypes ?? [];
        const current = deck.cards.filter((card) => allowedWheelTypes.includes(card.board.config.wheels)).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} couriers are running ${allowedWheelTypes.join(" / ")} wheels.`,
        );
      }
      case "archetype": {
        const current = deck.cards.filter((card) => card.prompts.archetype === requirement.archetype).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} ${requirement.archetype} couriers in the deck.`,
        );
      }
      case "faction": {
        const current = deck.cards.filter((card) => card.identity.crew === requirement.faction).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} ${requirement.faction} couriers in the deck.`,
        );
      }
      case "stat_total": {
        const stat = requirement.stat ?? "speed";
        const current = deck.cards.reduce((sum, card) => sum + card.stats[stat], 0);
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} total ${stat} across the deck.`,
        );
      }
      case "district_card": {
        const district = requirement.district ?? mission.district;
        const current = deck.cards.filter((card) => card.prompts.district === district).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} local couriers from ${district}.`,
        );
      }
    }
  });

  const eligible = results.every((result) => result.met);
  const firstUnmet = results.find((result) => !result.met);
  const eligibleCardCount = results.find((result) => result.requirement.type === "district_access")?.current ?? 0;

  return {
    deckId: deck.id,
    deckName: deck.name,
    eligible,
    eligibleCardCount,
    summary: eligible
      ? `${deck.name} can clear the ${mission.title} route.`
      : firstUnmet?.detail ?? `${deck.name} is missing mission requirements.`,
    results,
  };
}
