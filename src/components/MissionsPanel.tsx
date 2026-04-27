import { useCallback, useEffect, useMemo, useState } from "react";
import { isEnabled } from "../lib/featureFlags";
import { useAuth } from "../context/AuthContext";
import { useDecks } from "../hooks/useDecks";
import { useDistrictWeather } from "../hooks/useDistrictWeather";
import {
  evaluateMissionDeck,
  getMissionEffectiveRequirements,
  getMissionEffectiveRewards,
  getMissionForkOption,
  getMissionRequirementBadge,
  getMissionStateLabel,
  getMissionWeatherSummary,
} from "../lib/missions";
import { getMissionBoard, runMission } from "../services/missions";
import type {
  MissionBoardEntry,
  MissionBoardProgression,
  MissionRequirementResult,
} from "../lib/sharedTypes";

interface MissionsPanelProps {
  uid: string;
}

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
            {missions.map((mission) => (
              <button
                key={mission.id}
                type="button"
                className={[
                  "mission-selector-card",
                  selectedMission?.id === mission.id ? "mission-selector-card--active" : "",
                  mission.status === "completed" ? "mission-selector-card--completed" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelectedMissionId(mission.id)}
              >
                {mission.status === "completed" && (
                  <span className="mission-selector-card__check" aria-hidden="true">✓</span>
                )}
                <div className="mission-selector-card__topline">
                  <span className="mission-selector-card__district">{mission.district}</span>
                  <span
                    className={`mission-selector-card__state${mission.status === "completed" ? "" : " mission-selector-card__state--available"}`}
                  >
                    {getMissionStateLabel(mission)}
                  </span>
                </div>
                <strong className="mission-selector-card__name">{mission.title}</strong>
                <p className="mission-selector-card__tagline">{mission.tagline}</p>
                <div className="mission-selector-card__badges">
                  <span className="mission-selector-card__badge tag--ozzies">+{mission.rewardOzzies} Oz</span>
                  <span className="mission-selector-card__badge">+{mission.rewardXp} XP</span>
                  {mission.requirements.slice(0, 2).map((requirement) => (
                    <span key={`${mission.id}-${requirement.label}`} className="mission-selector-card__badge">
                      {getMissionRequirementBadge(requirement)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {selectedMission && (
            <div className="mission-panel mission-panel--detail">
              <div className="mission-panel__header">
                <div>
                  <div className="mission-selector-card__district">{selectedMission.district}</div>
                  <h3 className="mission-selector-card__name">{selectedMission.title}</h3>
                  <p className="mission-selector-card__tagline">{selectedMission.description}</p>
                </div>
                <div className="mission-panel__actions">
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

              <div className="mission-result">
                <div className="mission-result__hero">
                  <div className="mission-result__headline">{selectedMission.tagline}</div>
                  <span
                    className={`mission-result__badge ${selectedMission.status === "completed" ? "mission-result__badge--success" : "mission-result__badge--fail"}`}
                  >
                    {selectedMission.status === "completed" ? "Route Cleared" : "Awaiting Deck"}
                  </span>
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

              {selectedMission.fork && (
                <div className="mission-panel mission-fork">
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
                </div>
              )}

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

              <div className="mission-stats">
                <div className="mission-stat-row">
                  <span className="mission-stat-label">Selected deck</span>
                  <span className="mission-stat-value">{selectedDeck?.name ?? "No deck selected"}</span>
                </div>
                {selectedForkOption && (
                  <div className="mission-stat-row">
                    <span className="mission-stat-label">Chosen route</span>
                    <span className="mission-stat-value">{selectedForkOption.label}</span>
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

              {selectedEvaluation && !selectedEvaluation.eligible && (
                <p className="mission-warning">{selectedEvaluation.summary}</p>
              )}
              {selectedMission.lastRunSummary && (
                <p className="mission-warning">{selectedMission.lastRunSummary}</p>
              )}

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
            </div>
          )}
        </div>
      )}
    </section>
  );
}
