const DISTRICT_WHEEL_ACCESS_RULES = {
  Airaway: {
    allowedWheelTypes: ['Urethane'],
  },
  'Glass City': {
    allowedWheelTypes: ['Urethane', 'Pneumatic', 'Rubber', 'Cloud'],
  },
  'The Grid': {
    allowedWheelTypes: ['Urethane', 'Pneumatic', 'Rubber', 'Cloud'],
  },
  Batteryville: {
    allowedWheelTypes: ['Pneumatic', 'Rubber', 'Cloud'],
  },
  Nightshade: {
    allowedWheelTypes: ['Pneumatic', 'Rubber', 'Cloud'],
  },
  'The Forest': {
    allowedWheelTypes: ['Pneumatic', 'Rubber'],
  },
};

export const MISSION_BOARD_DEFINITIONS = [
  {
    definitionId: 'batteryville-breaker-yard',
    sortOrder: 0,
    title: 'Breaker Yard Relay',
    tagline: 'Shift freight through Batteryville without losing your axle.',
    description:
      "Batteryville only respects decks that can absorb punishment. Bring a full squad, keep your line moving, and prove your couriers can survive the scrapyard lanes.",
    district: 'Batteryville',
    rewardXp: 180,
    rewardOzzies: 90,
    requirements: [
      { type: 'min_cards', label: 'Bring a full six-card deck.', count: 6 },
      { type: 'district_access', label: 'At least 2 couriers can enter Batteryville.', count: 2, district: 'Batteryville' },
      { type: 'district_card', label: 'Include 1 Batteryville local in the deck.', count: 1, district: 'Batteryville' },
      { type: 'stat_total', label: 'Reach 28 total Grit across the deck.', count: 28, stat: 'grit' },
    ],
  },
  {
    definitionId: 'nightshade-tunnel-run',
    sortOrder: 1,
    title: 'Nightshade Tunnel Run',
    tagline: 'Quiet wheels, clean shadows, no witnesses.',
    description:
      "The Murk doesn't care about brute force. It rewards couriers who can ride rough access lines, stay hidden, and finish the drop before the tunnel crews notice.",
    district: 'Nightshade',
    rewardXp: 190,
    rewardOzzies: 110,
    requirements: [
      { type: 'min_cards', label: 'Bring a full six-card deck.', count: 6 },
      { type: 'district_access', label: 'At least 2 couriers can enter Nightshade.', count: 2, district: 'Nightshade' },
      { type: 'stat_total', label: 'Reach 28 total Stealth across the deck.', count: 28, stat: 'stealth' },
    ],
  },
  {
    definitionId: 'airaway-sky-lane',
    sortOrder: 2,
    title: 'Airaway Sky-Lane',
    tagline: 'Only street-quiet rigs make it through the checkpoint glass.',
    description:
      'Airaway chews up loud hardware. Build a clean, fast deck with enough street-wheel couriers to get through the scanners before the corp towers close the route.',
    district: 'Airaway',
    rewardXp: 170,
    rewardOzzies: 85,
    requirements: [
      { type: 'min_cards', label: 'Bring a full six-card deck.', count: 6 },
      { type: 'wheel_type', label: 'Run at least 2 street-wheel couriers.', count: 2, wheelTypes: ['Urethane'] },
      { type: 'district_access', label: 'At least 1 courier can enter Airaway.', count: 1, district: 'Airaway' },
      { type: 'stat_total', label: 'Reach 24 total Speed across the deck.', count: 24, stat: 'speed' },
    ],
  },
  {
    definitionId: 'grid-trace',
    sortOrder: 3,
    title: 'Grid Trace Job',
    tagline: "Cascade's cameras never blink. Your deck shouldn't either.",
    description:
      'The Grid is a surveillance maze. Run a fast stack with at least one Technarchy operative and enough district-ready hardware to stay ahead of the trace.',
    district: 'The Grid',
    rewardXp: 220,
    rewardOzzies: 125,
    requirements: [
      { type: 'min_cards', label: 'Bring a full six-card deck.', count: 6 },
      { type: 'district_access', label: 'At least 2 couriers can enter The Grid.', count: 2, district: 'The Grid' },
      { type: 'archetype', label: 'Include 1 Knights Technarchy courier.', count: 1, archetype: 'The Knights Technarchy' },
      { type: 'stat_total', label: 'Reach 30 total Speed across the deck.', count: 30, stat: 'speed' },
    ],
  },
  {
    definitionId: 'forest-rootline',
    sortOrder: 4,
    title: 'Rootline Extraction',
    tagline: 'Bring rough-route wheels or leave the package in the roots.',
    description:
      "The Forest only opens to decks built for root bridges and wet timber lanes. If your riders can't bite into the route, the job dies before it starts.",
    district: 'The Forest',
    rewardXp: 210,
    rewardOzzies: 120,
    requirements: [
      { type: 'min_cards', label: 'Bring a full six-card deck.', count: 6 },
      { type: 'wheel_type', label: 'Run at least 2 rough-route wheel setups.', count: 2, wheelTypes: ['Pneumatic', 'Rubber'] },
      { type: 'district_access', label: 'At least 2 couriers can enter The Forest.', count: 2, district: 'The Forest' },
      { type: 'district_card', label: 'Include 1 Forest local in the deck.', count: 1, district: 'The Forest' },
    ],
  },
  {
    definitionId: 'glass-city-exchange',
    sortOrder: 5,
    title: 'Glass City Exchange',
    tagline: 'Any wheel can enter. Not every deck can finish the route.',
    description:
      'Glass City is open territory, which means everyone wants the payout. Bring enough ride-ready couriers and the range to finish the exchange before a rival cuts in.',
    district: 'Glass City',
    rewardXp: 160,
    rewardOzzies: 80,
    requirements: [
      { type: 'min_cards', label: 'Bring a full six-card deck.', count: 6 },
      { type: 'district_access', label: 'At least 3 couriers can enter Glass City.', count: 3, district: 'Glass City' },
      { type: 'district_card', label: 'Include 1 Glass City local in the deck.', count: 1, district: 'Glass City' },
      { type: 'stat_total', label: 'Reach 28 total Range across the deck.', count: 28, stat: 'range' },
    ],
  },
];

function getRequirementTarget(requirement) {
  return typeof requirement.count === 'number' ? requirement.count : 0;
}

function buildWeatherMap(weatherPayload) {
  return Object.fromEntries((weatherPayload?.districts ?? []).map((entry) => [entry.district, entry]));
}

function canCardAccessDistrict(card, district, weatherByDistrict) {
  const wheelType = card?.board?.config?.wheels;
  const boardType = card?.board?.config?.boardType;
  const allowedWheelTypes = DISTRICT_WHEEL_ACCESS_RULES[district]?.allowedWheelTypes ?? [];
  if (!allowedWheelTypes.includes(wheelType)) {
    return false;
  }
  const weather = weatherByDistrict[district];
  if (weather?.accessRule && weather.accessRule.requiredBoardType !== boardType) {
    return false;
  }
  return true;
}

function buildRequirementResult(requirement, current, detail) {
  const needed = getRequirementTarget(requirement);
  return {
    requirement,
    met: current >= needed,
    current,
    needed,
    detail,
  };
}

export function createMissionBoardEntries(uid, now = new Date().toISOString()) {
  return MISSION_BOARD_DEFINITIONS.map((definition) => ({
    id: `${uid}_${definition.definitionId}`,
    uid,
    system: 'mission_board',
    schemaVersion: 2,
    status: 'active',
    progress: 0,
    target: 1,
    createdAt: now,
    updatedAt: now,
    ...definition,
  }));
}

export function evaluateMissionDeck(deck, mission, weatherPayload = null) {
  const weatherByDistrict = buildWeatherMap(weatherPayload);
  const cards = Array.isArray(deck?.cards) ? deck.cards : [];
  const results = mission.requirements.map((requirement) => {
    switch (requirement.type) {
      case 'min_cards': {
        const current = cards.length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} cards ready for the run.`,
        );
      }
      case 'district_access': {
        const district = requirement.district ?? mission.district;
        const current = cards.filter((card) => canCardAccessDistrict(card, district, weatherByDistrict)).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} couriers can currently enter ${district}.`,
        );
      }
      case 'wheel_type': {
        const allowedWheelTypes = requirement.wheelTypes ?? [];
        const current = cards.filter((card) => allowedWheelTypes.includes(card?.board?.config?.wheels)).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} couriers are running ${allowedWheelTypes.join(' / ')} wheels.`,
        );
      }
      case 'archetype': {
        const current = cards.filter((card) => card?.prompts?.archetype === requirement.archetype).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} ${requirement.archetype} couriers in the deck.`,
        );
      }
      case 'faction': {
        const current = cards.filter((card) => card?.identity?.crew === requirement.faction).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} ${requirement.faction} couriers in the deck.`,
        );
      }
      case 'stat_total': {
        const stat = requirement.stat ?? 'speed';
        const current = cards.reduce((sum, card) => sum + (Number(card?.stats?.[stat]) || 0), 0);
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} total ${stat} across the deck.`,
        );
      }
      case 'district_card': {
        const district = requirement.district ?? mission.district;
        const current = cards.filter((card) => card?.prompts?.district === district).length;
        return buildRequirementResult(
          requirement,
          current,
          `${current}/${getRequirementTarget(requirement)} local couriers from ${district}.`,
        );
      }
      default:
        throw new Error(
          `Unknown mission requirement type: ${requirement.type}. Expected one of min_cards, district_access, wheel_type, archetype, faction, stat_total, or district_card.`,
        );
    }
  });

  const eligible = results.every((result) => result.met);
  const firstUnmet = results.find((result) => !result.met);
  const eligibleCardCount = results.find((result) => result.requirement.type === 'district_access')?.current ?? 0;

  return {
    deckId: typeof deck?.id === 'string' ? deck.id : '',
    deckName: typeof deck?.name === 'string' ? deck.name : 'Unnamed Deck',
    eligible,
    eligibleCardCount,
    summary: eligible
      ? `${typeof deck?.name === 'string' ? deck.name : 'This deck'} can clear the ${mission.title} route.`
      : firstUnmet?.detail ?? 'This deck is missing mission requirements.',
    results,
  };
}
