import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAuth } from "../context/AuthContext";
import { useDecks } from "../hooks/useDecks";
import { useDistrictWeather } from "../hooks/useDistrictWeather";
import { isEnabled } from "../lib/featureFlags";
import { DISTRICT_LORE } from "../lib/lore";
import {
  evaluateMissionDeck,
  getMissionEffectiveRequirements,
  getMissionEffectiveRewards,
  getMissionForkOption,
  getMissionRequirementBadge,
  getMissionStateLabel,
  getMissionWeatherSummary,
} from "../lib/missions";
import type {
  MissionBoardEntry,
  MissionBoardProgression,
  MissionRequirementResult,
  MissionRunResponse,
} from "../lib/sharedTypes";
import type { District } from "../lib/types";
import { getMissionBoard, runMission } from "../services/missions";

interface MissionsPanelProps {
  uid: string;
}

interface MissionPresentation {
  operation: string;
  patron: string;
  stakes: string;
  rewardFocus: string[];
  sceneTags: string[];
  successLabel: string;
  failureLabel: string;
}

const DISTRICT_THEMES: Record<District, { accent: string; accentSoft: string; glow: string; glyph: string }> = {
  Airaway: {
    accent: "#7de7ff",
    accentSoft: "rgba(125,231,255,0.2)",
    glow: "rgba(125,231,255,0.24)",
    glyph: "⬡",
  },
  Batteryville: {
    accent: "#ffc94d",
    accentSoft: "rgba(255,201,77,0.18)",
    glow: "rgba(255,201,77,0.24)",
    glyph: "⚙",
  },
  "The Grid": {
    accent: "#7dffb6",
    accentSoft: "rgba(125,255,182,0.18)",
    glow: "rgba(125,255,182,0.24)",
    glyph: "▦",
  },
  Nightshade: {
    accent: "#d490ff",
    accentSoft: "rgba(212,144,255,0.18)",
    glow: "rgba(212,144,255,0.24)",
    glyph: "✦",
  },
  "The Forest": {
    accent: "#8cff8a",
    accentSoft: "rgba(140,255,138,0.18)",
    glow: "rgba(140,255,138,0.24)",
    glyph: "❋",
  },
  "Glass City": {
    accent: "#ffd98f",
    accentSoft: "rgba(255,217,143,0.18)",
    glow: "rgba(255,217,143,0.24)",
    glyph: "◈",
  },
};

const DEFAULT_PRESENTATION: MissionPresentation = {
  operation: "Underground contract",
  patron: "Courier network relay",
  stakes: "Pick a route, balance risk against reward, and build a crew that can survive the district pressure.",
  rewardFocus: ["Cash routes for grinders", "XP routes for builders", "Split routes for balanced crews"],
  sceneTags: ["District intel", "Crew pressure", "Hard choices"],
  successLabel: "Route locked",
  failureLabel: "Route snapped",
};

const MISSION_PRESENTATIONS: Record<string, MissionPresentation> = {
  "batteryville-breaker-yard": {
    operation: "Batteryville relay",
    patron: "HexChain recycler crews",
    stakes: "Keep freight moving through the breaker yards before the crusher lane turns the relay into scrap.",
    rewardFocus: ["Heavy Ozzy payout path", "Local-heavy XP path", "Best for grit stacks"],
    sceneTags: ["Scrapyard sirens", "Union pressure", "Axle-breaking lanes"],
    successLabel: "Relay held",
    failureLabel: "Freight dropped",
  },
  "nightshade-tunnel-run": {
    operation: "Nightshade ghost line",
    patron: "Tunnel crews in the Murk",
    stakes: "Move a silent drop through contested tunnel chains without drawing the deeper Nightshade gangs.",
    rewardFocus: ["Stealth-first Ozzies", "Local support XP", "Best for shadow decks"],
    sceneTags: ["Neon fog", "Witnessless lanes", "Crew shadows"],
    successLabel: "Tunnel cleared",
    failureLabel: "Shadows closed",
  },
  "airaway-sky-lane": {
    operation: "Airaway checkpoint breach",
    patron: "Contractors running the sky-lane",
    stakes: "Slip past glass checkpoints before the towers close the lane and strip your pass.",
    rewardFocus: ["Fast-cash sprint", "Scanner-spoof XP", "Best for clean wheel decks"],
    sceneTags: ["Checkpoint glass", "Corp scanners", "Rooftop heat"],
    successLabel: "Lane crossed",
    failureLabel: "Pass burned",
  },
  "grid-trace": {
    operation: "Cascade trace break",
    patron: "Static Pack intermediaries",
    stakes: "Stay ahead of Cascade's cameras long enough to pull a trace and escape the logging net.",
    rewardFocus: ["Technarchy cash route", "Blackout XP route", "Best for speed stacks"],
    sceneTags: ["Sensor glare", "Trace logs", "Blackout windows"],
    successLabel: "Trace broken",
    failureLabel: "Trace caught",
  },
  "forest-rootline": {
    operation: "Root bridge extraction",
    patron: "Wooder couriers",
    stakes: "Drag a live package out of wet timber lanes before the bridges give way under the crew.",
    rewardFocus: ["Guide-backed Ozzies", "Mudline XP", "Best for rough-route wheels"],
    sceneTags: ["Wet timber", "Guide ropes", "Mud pressure"],
    successLabel: "Package lifted",
    failureLabel: "Trail swallowed",
  },
  "glass-city-exchange": {
    operation: "Open territory exchange",
    patron: "Glass brokers and cutouts",
    stakes: "Finish the handoff before a rival broker turns the open route into a public ambush.",
    rewardFocus: ["Safer XP handshake", "Long-range cash cutout", "Best for balanced range crews"],
    sceneTags: ["Mirror alleys", "Broker tells", "Rival eyes"],
    successLabel: "Exchange landed",
    failureLabel: "Broker burned",
  },
  "batteryville-switchyard-uprising": {
    operation: "Strike-pay convoy",
    patron: "Batteryville recycler unions",
    stakes: "Smuggle strike pay and proof drives past HexChain eyes while the switchyard crews stage an uprising.",
    rewardFocus: ["Worker-backed XP", "Boss-bribe Ozzies", "Balanced proof-vault split"],
    sceneTags: ["Switch levers", "Strike drums", "Proof drives"],
    successLabel: "Strike fund delivered",
    failureLabel: "Yard locked down",
  },
  "nightshade-moonrise-echo": {
    operation: "Moonriser signal run",
    patron: "Moonriser rave network",
    stakes: "Carry a rave broadcast through the Murk before the Dark Lanes seize the booth that made Skids famous.",
    rewardFocus: ["High-rep XP rush", "Stealth cash hush route", "Split route for hybrid decks"],
    sceneTags: ["Rave strobes", "Basement echo", "Crew handshakes"],
    successLabel: "Signal carried",
    failureLabel: "Broadcast cut",
  },
  "airaway-coldchain-pass": {
    operation: "Coldchain badge breach",
    patron: "Black-clinic contractors",
    stakes: "Lift a sealed med-crate through Airaway before the cloned contractor badge burns out in the cold air.",
    rewardFocus: ["Scanner-safe XP", "Executive-drop Ozzies", "Split route for utility decks"],
    sceneTags: ["Cold cargo", "Badge clones", "Maintenance chutes"],
    successLabel: "Crate floated through",
    failureLabel: "Badge expired",
  },
  "grid-parent-trace": {
    operation: "Vanished worker trace",
    patron: "Batteryville families and Static Pack archivists",
    stakes: "Follow the same Cascade worker IDs that swallowed Skids' parents before the archive burns the trail.",
    rewardFocus: ["Lore-heavy XP", "Archive heist cash", "Cross-district split rewards"],
    sceneTags: ["Missing IDs", "Archive shards", "Cascade ghosts"],
    successLabel: "Trail reopened",
    failureLabel: "Trail purged",
  },
};

const DISTRICT_LORE_BY_NAME = new Map(
  DISTRICT_LORE.filter((entry) => entry.kind === "district").map((entry) => [entry.name, entry]),
);

function formatTimestamp(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

function getDefaultRequirementResults(mission: MissionBoardEntry, selectedForkOptionId?: string | null): MissionRequirementResult[] {
  return getMissionEffectiveRequirements(mission, selectedForkOptionId).map((requirement) => ({
    requirement,
    met: false,
    current: 0,
    needed: requirement.count ?? 0,
    detail: requirement.label,
  }));
}

function formatForkRewardDelta(delta?: number): string | null {
  if (!delta) return null;
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function getMissionPresentation(mission: MissionBoardEntry | null): MissionPresentation {
  if (!mission) return DEFAULT_PRESENTATION;
  return MISSION_PRESENTATIONS[mission.definitionId] ?? DEFAULT_PRESENTATION;
}

function getMissionThemeStyle(district: District): CSSProperties {
  const theme = DISTRICT_THEMES[district];
  return {
    "--mission-accent": theme.accent,
    "--mission-accent-soft": theme.accentSoft,
    "--mission-glow": theme.glow,
  } as CSSProperties;
}

function getMissionResultLog(result: MissionRunResponse): string[] {
  const mission = result.mission;
  const forkOption = getMissionForkOption(mission, mission.selectedForkOptionId);
  if (result.rewardGranted) {
    const rewards = getMissionEffectiveRewards(mission, mission.selectedForkOptionId);
    return [
      `${mission.selectedDeckName ?? result.evaluation.deckName} cleared ${mission.title}${forkOption ? ` via ${forkOption.label}` : ""}.`,
      `Banked +${rewards.rewardXp} Mission XP.`,
      `Pulled +${rewards.rewardOzzies} Ozzies out of ${mission.district}.`,
    ];
  }
  return mission.lastRunFailureReasons?.length
    ? mission.lastRunFailureReasons
    : result.evaluation.results.filter((entry) => !entry.met).map((entry) => entry.detail);
}

export function MissionsPanel({ uid }: MissionsPanelProps) {
  const { user } = useAuth();
  const { decks } = useDecks();
  const { weatherByDistrict } = useDistrictWeather();
  const [missions, setMissions] = useState<MissionBoardEntry[]>([]);
  const [progression, setProgression] = useState<MissionBoardProgression>({
    missionXp: 0,
    missionOzzies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningMissionId, setRunningMissionId] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedForkOptionId, setSelectedForkOptionId] = useState<string | null>(null);
  const [missionResult, setMissionResult] = useState<MissionRunResponse | null>(null);

  useEffect(() => {
    if (!isEnabled("MISSIONS", user)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMissionBoard(uid, user?.email)
      .then((payload) => {
        if (cancelled) return;
        setMissions(payload.missions);
        setProgression(payload.progression);
        setSelectedMissionId((current) => current ?? payload.missions[0]?.id ?? null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load mission board.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, user]);

  useEffect(() => {
    if (!selectedMissionId && missions.length > 0) {
      setSelectedMissionId(missions[0].id);
    }
  }, [missions, selectedMissionId]);

  useEffect(() => {
    if (selectedDeckId && decks.some((deck) => deck.id === selectedDeckId)) return;
    setSelectedDeckId(decks[0]?.id ?? null);
  }, [decks, selectedDeckId]);

  useEffect(() => {
    const mission = missions.find((entry) => entry.id === selectedMissionId) ?? missions[0] ?? null;
    setSelectedForkOptionId(mission?.selectedForkOptionId ?? mission?.fork?.options[0]?.id ?? null);
  }, [missions, selectedMissionId]);

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) ?? missions[0] ?? null,
    [missions, selectedMissionId],
  );
  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null,
    [decks, selectedDeckId],
  );
  const deckEvaluations = useMemo(
    () => selectedMission
      ? decks.map((deck) => evaluateMissionDeck(deck, selectedMission, weatherByDistrict, selectedForkOptionId))
      : [],
    [decks, selectedForkOptionId, selectedMission, weatherByDistrict],
  );
  const selectedEvaluation = useMemo(
    () => selectedMission && selectedDeck
      ? evaluateMissionDeck(selectedDeck, selectedMission, weatherByDistrict, selectedForkOptionId)
      : null,
    [selectedDeck, selectedForkOptionId, selectedMission, weatherByDistrict],
  );
  const selectedForkOption = useMemo(
    () => (selectedMission ? getMissionForkOption(selectedMission, selectedForkOptionId) : null),
    [selectedForkOptionId, selectedMission],
  );
  const selectedRewards = useMemo(
    () => (selectedMission ? getMissionEffectiveRewards(selectedMission, selectedForkOptionId) : { rewardXp: 0, rewardOzzies: 0 }),
    [selectedForkOptionId, selectedMission],
  );
  const selectedPresentation = useMemo(() => getMissionPresentation(selectedMission), [selectedMission]);
  const selectedDistrictLore = useMemo(
    () => (selectedMission ? DISTRICT_LORE_BY_NAME.get(selectedMission.district) ?? null : null),
    [selectedMission],
  );
  const missionResultLog = useMemo(
    () => (missionResult ? getMissionResultLog(missionResult) : []),
    [missionResult],
  );
  const selectedDeckCardCount = selectedDeck?.cards.length ?? 0;
  const selectedDeckReadyCount = selectedEvaluation?.eligibleCardCount ?? 0;
  const selectedRouteLabel = selectedForkOption?.label ?? "Main line";
  const selectedOutcomeLabel = selectedMission?.status === "completed"
    ? "Route Cleared"
    : selectedEvaluation?.eligible
      ? "Deck Ready"
      : "Needs deck";
  const selectedOutcomeBadgeClass = selectedMission?.status === "completed" || selectedEvaluation?.eligible
    ? "mission-result__badge mission-result__badge--success"
    : "mission-result__badge mission-result__badge--fail";

  const handleRunMission = useCallback(async () => {
    if (!selectedMission || !selectedDeck) return;
    setRunningMissionId(selectedMission.id);
    setError(null);
    try {
      const result = await runMission(uid, selectedMission.id, selectedDeck.id, selectedForkOptionId, user?.email);
      setMissions((current) => current.map((mission) => (
        mission.id === result.mission.id ? result.mission : mission
      )));
      setProgression(result.progression);
      setSelectedDeckId(result.mission.selectedDeckId ?? selectedDeck.id);
      setSelectedForkOptionId(result.mission.selectedForkOptionId ?? selectedForkOptionId);
      setMissionResult(result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to resolve mission.");
    } finally {
      setRunningMissionId(null);
    }
  }, [selectedDeck, selectedForkOptionId, selectedMission, uid, user]);

  if (!isEnabled("MISSIONS", user)) return null;

  return (
    <section className="mission-panel mission-selector-panel" aria-label="Mission board">
      <div className="mission-selector-panel__header">
        <div>
          <div className="mission-selector-panel__title">District mission grid</div>
          <p className="mission-selector-panel__summary">
            Pick a contract, choose a deck, and clear the route with the right cards and wheels.
          </p>
        </div>
        <div className="mission-selector-card__badges">
          <span className="mission-selector-card__badge">⚡ {progression.missionXp} Mission XP</span>
          <span className="mission-selector-card__badge tag--ozzies">💰 {progression.missionOzzies} Ozzies</span>
        </div>
      </div>

      {loading && (
        <div className="mission-selector-empty">Loading mission board…</div>
      )}

      {!loading && error && (
        <div className="mission-selector-empty" role="alert">{error}</div>
      )}

      {!loading && !error && missions.length === 0 && (
        <div className="mission-selector-empty">
          No contracts are active yet. Check your connection and try again.
        </div>
      )}

      {!loading && !error && missions.length > 0 && (
        <div className="mission-grid">
          <div className="mission-selector-grid">
            {missions.map((mission) => {
              const presentation = getMissionPresentation(mission);
              return (
                <button
                  key={mission.id}
                  type="button"
                  className={[
                    "mission-selector-card",
                    selectedMission?.id === mission.id ? "mission-selector-card--active" : "",
                    mission.status === "completed" ? "mission-selector-card--completed" : "",
                  ].filter(Boolean).join(" ")}
                  style={getMissionThemeStyle(mission.district)}
                  onClick={() => setSelectedMissionId(mission.id)}
                >
                  {mission.status === "completed" && (
                    <span className="mission-selector-card__check" aria-hidden="true">✓</span>
                  )}
                  <div className="mission-selector-card__scene" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="mission-selector-card__topline">
                    <span className="mission-selector-card__district">{mission.district}</span>
                    <span
                      className={`mission-selector-card__state${mission.status === "completed" ? "" : " mission-selector-card__state--available"}`}
                    >
                      {getMissionStateLabel(mission)}
                    </span>
                  </div>
                  <span className="mission-selector-card__operation">{presentation.operation}</span>
                  <strong className="mission-selector-card__name">{mission.title}</strong>
                  <p className="mission-selector-card__tagline">{mission.tagline}</p>
                  <div className="mission-selector-card__badges">
                    <span className="mission-selector-card__badge tag--ozzies">+{mission.rewardOzzies} Oz</span>
                    <span className="mission-selector-card__badge">+{mission.rewardXp} XP</span>
                    <span className="mission-selector-card__badge">{presentation.rewardFocus[0]}</span>
                    {mission.requirements.slice(0, 2).map((requirement) => (
                      <span key={`${mission.id}-${requirement.label}`} className="mission-selector-card__badge">
                        {getMissionRequirementBadge(requirement)}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedMission && (
            <div className="mission-panel mission-panel--detail" style={getMissionThemeStyle(selectedMission.district)}>
              <div className="mission-panel__header">
                <div>
                  <div className="mission-selector-card__district">{selectedMission.district}</div>
                  <h3 className="mission-selector-card__name">{selectedMission.title}</h3>
                  <p className="mission-selector-card__tagline">{selectedMission.description}</p>
                </div>
              </div>

              <div className="mission-cinematic">
                <div className="mission-cinematic__fx" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mission-cinematic__copy">
                  <span className="mission-cinematic__eyebrow">{selectedPresentation.operation}</span>
                  <strong className="mission-cinematic__title">{selectedPresentation.patron}</strong>
                  <p className="mission-cinematic__body">{selectedPresentation.stakes}</p>
                  <div className="mission-intel-tags">
                    {selectedPresentation.sceneTags.map((tag) => (
                      <span key={`${selectedMission.id}-${tag}`} className="mission-intel-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="mission-cinematic__aside">
                  <span className="mission-cinematic__glyph" aria-hidden="true">{DISTRICT_THEMES[selectedMission.district].glyph}</span>
                  <span className="mission-cinematic__metric-label">Controlled by</span>
                  <strong>{selectedDistrictLore?.controlledBy ?? "Courier crews"}</strong>
                  <span className="mission-cinematic__metric-label">Crew pressure</span>
                  <span>{selectedDistrictLore?.crews.slice(0, 2).join(" · ") ?? selectedMission.district}</span>
                </div>
              </div>

              <div className="mission-flow">
                {selectedMission.fork && (
                  <section className="mission-stage mission-panel mission-fork">
                    <div className="mission-stage__header">
                      <div>
                        <span className="mission-stage__eyebrow">Route choice</span>
                        <h4 className="mission-stage__title">Choose the line you want to push</h4>
                        <p className="mission-stage__summary">
                          Different paths shift the payout and the pressure on your crew.
                        </p>
                      </div>
                    </div>
                    <div className="mission-fork__header">
                      <span className="mission-fork__badge">{selectedMission.fork.badge}</span>
                      <p className="mission-fork__prompt">{selectedMission.fork.prompt}</p>
                    </div>
                    <div className="mission-fork__options">
                      {selectedMission.fork.options.map((option) => (
                        <button
                          key={`${selectedMission.id}-${option.id}`}
                          type="button"
                          className={`mission-fork__option${selectedForkOption?.id === option.id ? " mission-fork__option--active" : ""}`}
                          onClick={() => setSelectedForkOptionId(option.id)}
                          aria-pressed={selectedForkOption?.id === option.id}
                        >
                          <span className="mission-fork__option-label">{option.label}</span>
                          <span className="mission-fork__option-meta">
                            {option.rewardOzziesDelta && option.rewardXpDelta
                              ? "Split reward route"
                              : option.rewardOzziesDelta
                                ? "Cash pressure route"
                                : "XP pressure route"}
                          </span>
                          <span className="mission-fork__option-desc">{option.description}</span>
                          {(option.rewardXpDelta || option.rewardOzziesDelta) && (
                            <span className="mission-fork__option-desc">
                              {option.rewardXpDelta ? `${formatForkRewardDelta(option.rewardXpDelta)} XP` : null}
                              {option.rewardXpDelta && option.rewardOzziesDelta ? " · " : null}
                              {option.rewardOzziesDelta ? `${formatForkRewardDelta(option.rewardOzziesDelta)} Oz` : null}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mission-stage mission-panel">
                  <div className="mission-stage__header">
                    <div>
                      <span className="mission-stage__eyebrow">Deck selection</span>
                      <h4 className="mission-stage__title">Pick the crew taking the run</h4>
                      <p className="mission-stage__summary">
                        Lock in a deck first, then use the outcome panel to confirm the route is worth launching.
                      </p>
                    </div>
                    <div className="mission-deck-focus">
                      <span className="mission-deck-focus__label">Current pick</span>
                      <strong className="mission-deck-focus__name">{selectedDeck?.name ?? "No deck selected"}</strong>
                      <span className="mission-deck-focus__meta">
                        {selectedDeckCardCount} cards · {selectedDeckReadyCount} route-ready · {selectedRouteLabel}
                      </span>
                    </div>
                  </div>
                  <div className="mission-runner-grid">
                    {deckEvaluations.map((evaluation) => {
                      const deck = decks.find((entry) => entry.id === evaluation.deckId);
                      return (
                        <button
                          key={evaluation.deckId}
                          type="button"
                          className={`mission-runner-card${selectedDeck?.id === evaluation.deckId ? " mission-runner-card--active" : ""}`}
                          onClick={() => setSelectedDeckId(evaluation.deckId)}
                        >
                          <strong>{evaluation.deckName}</strong>
                          <span className="mission-selector-card__tagline">
                            {deck?.cards.length ?? 0} cards · {evaluation.eligibleCardCount} route-ready
                          </span>
                          <span
                            className={`mission-result__badge ${evaluation.eligible ? "mission-result__badge--success" : "mission-result__badge--fail"}`}
                          >
                            {evaluation.eligible ? "Can run" : "Blocked"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="mission-stage mission-panel">
                  <div className="mission-stage__header">
                    <div>
                      <span className="mission-stage__eyebrow">Run outlook</span>
                      <h4 className="mission-stage__title">See the outcome before you launch</h4>
                      <p className="mission-stage__summary">
                        Confirm access, rewards, and requirements with your selected deck before you commit.
                      </p>
                    </div>
                    <div className="mission-stage__actions">
                      <button
                        className="btn-primary"
                        onClick={handleRunMission}
                        disabled={
                          runningMissionId === selectedMission.id ||
                          selectedMission.status === "completed" ||
                          !selectedDeck ||
                          !selectedEvaluation?.eligible
                        }
                      >
                        {selectedMission.status === "completed"
                          ? "Mission Cleared"
                          : runningMissionId === selectedMission.id
                            ? "Running…"
                            : "Launch Run"}
                      </button>
                    </div>
                  </div>

                  <div className="mission-outcome-grid">
                    <article className="mission-outcome-card">
                      <div className="mission-result">
                        <div className="mission-result__hero">
                          <div className="mission-result__headline">{selectedMission.tagline}</div>
                          <span className={selectedOutcomeBadgeClass}>{selectedOutcomeLabel}</span>
                        </div>
                        <div className="mission-result__rewards">
                          <div className="mission-result__reward-card">
                            <span className="mission-result__reward-label">Mission XP</span>
                            <strong className="mission-result__reward-value">+{selectedRewards.rewardXp}</strong>
                          </div>
                          <div className="mission-result__reward-card mission-result__reward-card--ozzies">
                            <span className="mission-result__reward-label">Ozzies</span>
                            <strong className="mission-result__reward-value">+{selectedRewards.rewardOzzies}</strong>
                          </div>
                        </div>
                      </div>

                      <div className={`mission-weather${selectedEvaluation && !selectedEvaluation.eligible ? " mission-weather--blocked" : ""}`}>
                        <div className="mission-weather__copy">
                          <span className="mission-weather__eyebrow">District access</span>
                          <strong className="mission-weather__title">{selectedMission.district}</strong>
                          <p className="mission-weather__body">
                            Access now: {getMissionWeatherSummary(selectedMission, weatherByDistrict)}.
                          </p>
                        </div>
                        <span
                          className={`mission-weather__status${selectedEvaluation && !selectedEvaluation.eligible ? " mission-weather__status--restricted" : ""}`}
                        >
                          {selectedEvaluation?.eligible ? "Deck ready" : "Needs work"}
                        </span>
                      </div>
                    </article>

                    <article className="mission-outcome-card">
                      <div className="mission-stats">
                        <div className="mission-stat-row">
                          <span className="mission-stat-label">Selected deck</span>
                          <span className="mission-stat-value">{selectedDeck?.name ?? "No deck selected"}</span>
                        </div>
                        {selectedMission.fork && (
                          <div className="mission-stat-row">
                            <span className="mission-stat-label">Chosen route</span>
                            <span className="mission-stat-value">{selectedRouteLabel}</span>
                          </div>
                        )}
                        <div className="mission-stat-row">
                          <span className="mission-stat-label">Last run</span>
                          <span className="mission-stat-value">{formatTimestamp(selectedMission.lastRunAt) ?? "Never launched"}</span>
                        </div>
                        {selectedMission.status === "completed" && (
                          <div className="mission-stat-row">
                            <span className="mission-stat-label">Cleared with</span>
                            <span className="mission-stat-value">{selectedMission.selectedDeckName ?? "Unknown deck"}</span>
                          </div>
                        )}
                      </div>

                      <div className="mission-checks">
                        {(selectedEvaluation?.results ?? getDefaultRequirementResults(selectedMission, selectedForkOptionId)).map((result) => (
                          <span
                            key={`${selectedMission.id}-${result.requirement.label}`}
                            className="mission-selector-card__badge"
                            title={result.detail}
                          >
                            {result.met ? "✅" : "⛔"} {result.requirement.label}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>

                  {selectedEvaluation && !selectedEvaluation.eligible && (
                    <p className="mission-warning">{selectedEvaluation.summary}</p>
                  )}
                  {selectedMission.lastRunSummary && (
                    <p className="mission-warning">{selectedMission.lastRunSummary}</p>
                  )}
                </section>
              </div>

              <div className="mission-intel-grid">
                <article className="mission-intel-card">
                  <span className="mission-intel-card__label">District dossier</span>
                  <p>{selectedDistrictLore?.description ?? selectedMission.description}</p>
                  <p className="mission-intel-card__quote">
                    {selectedDistrictLore?.flavorTexts[0] ?? "Every route in this city wants a different kind of nerve."}
                  </p>
                </article>
                <article className="mission-intel-card">
                  <span className="mission-intel-card__label">Reward profile</span>
                  <ul className="mission-intel-list">
                    {selectedPresentation.rewardFocus.map((item) => (
                      <li key={`${selectedMission.id}-${item}`}>{item}</li>
                    ))}
                  </ul>
                  <p className="mission-intel-card__quote">
                    Atmosphere: {selectedDistrictLore?.atmosphere ?? selectedMission.tagline}
                  </p>
                </article>
              </div>
            </div>
          )}
        </div>
      )}

      {missionResult && (
        <div className="mission-result-overlay" role="dialog" aria-modal="true" aria-labelledby="mission-result-title">
          <div
            className={[
              "mission-panel",
              "mission-result-popup",
              "mission-result-panel",
              missionResult.rewardGranted ? "mission-result-panel--success" : "mission-result-panel--fail",
            ].join(" ")}
            style={getMissionThemeStyle(missionResult.mission.district)}
          >
            {missionResult.rewardGranted && (
              <div className="mission-result-panel__beams" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
            <button
              type="button"
              className="mission-result-popup__close"
              onClick={() => setMissionResult(null)}
              aria-label="Close mission result"
            >
              ×
            </button>
            <div className="mission-result-popup__summary">
              <span className="mission-selector-card__district">{missionResult.mission.district}</span>
              <h3 id="mission-result-title" className="mission-selector-card__name">
                {missionResult.rewardGranted
                  ? getMissionPresentation(missionResult.mission).successLabel
                  : getMissionPresentation(missionResult.mission).failureLabel}
              </h3>
              <p className="mission-selector-card__tagline">
                {missionResult.rewardGranted
                  ? missionResult.mission.lastRunSummary ?? missionResult.evaluation.summary
                  : missionResult.evaluation.summary}
              </p>
            </div>
            <div className="mission-result__rewards">
              <div className="mission-result__reward-card">
                <span className="mission-result__reward-label">Chosen deck</span>
                <strong className="mission-result__reward-value">
                  {missionResult.mission.selectedDeckName ?? missionResult.evaluation.deckName}
                </strong>
              </div>
              <div className="mission-result__reward-card mission-result__reward-card--ozzies">
                <span className="mission-result__reward-label">Route</span>
                <strong className="mission-result__reward-value">
                  {getMissionForkOption(missionResult.mission, missionResult.mission.selectedForkOptionId)?.label ?? "Main line"}
                </strong>
              </div>
            </div>
            <div className="mission-result-popup__grid">
              <div className="mission-result-popup__panel">
                <span className="mission-result-popup__eyebrow">Run log</span>
                <ul className="mission-log">
                  {missionResultLog.map((entry) => (
                    <li key={`${missionResult.mission.id}-${entry}`}>{entry}</li>
                  ))}
                </ul>
              </div>
              <div className="mission-result-popup__panel">
                <span className="mission-result-popup__eyebrow">Why players chase it</span>
                <ul className="mission-intel-list">
                  {getMissionPresentation(missionResult.mission).rewardFocus.map((entry) => (
                    <li key={`${missionResult.mission.id}-focus-${entry}`}>{entry}</li>
                  ))}
                </ul>
                <p className="mission-intel-card__quote">
                  {DISTRICT_LORE_BY_NAME.get(missionResult.mission.district)?.flavorTexts[1]
                    ?? "The district remembers who cleared the route and who folded."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
