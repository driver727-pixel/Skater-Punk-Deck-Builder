import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCharacterSeed, generateCard } from "../../lib/generator";
import {
  applyFactionBranding,
  FORGE_ARCHETYPE_OPTIONS,
  getForgeArchetypeLabel,
  resolveSecretFaction,
} from "../../lib/factionDiscovery";
import { DEFAULT_BOARD_CONFIG } from "../../components/BoardBuilder";
import { resolveArchetypeStyle } from "../../lib/styles";
import { sfxClick, sfxSuccessPing } from "../../lib/sfx";
import { removeBackground, isImageGenConfigured } from "../../services/imageGen";
import { generateGouacheBoard } from "../../services/boardImageGen";
import { buildBackgroundPrompt, buildCharacterPrompt, buildFramePrompt } from "../../lib/promptBuilder";
import { useTier } from "../../context/TierContext";
import { useAuth } from "../../context/AuthContext";
import { useFactionDiscovery } from "../../hooks/useFactionDiscovery";
import type { Archetype, BoardPlacement, CardPayload, CardPrompts, Faction } from "../../lib/types";
import {
  getForgeClassOptions,
  normalizeForgeRarity,
  type ForgeClassOption,
} from "../../lib/cardClassProgression";
import { createCharacterLayerValidator, useForgeLayers } from "./useForgeLayers";
import {
  CHARACTER_CACHE_VERSION,
  CHARACTER_GENERATION_OPTIONS,
  CHARACTER_MIN_DIMENSIONS,
  CHARACTER_SEED_VARIANTS,
} from "./constants";
import { applyPreviewUpdates, buildRandomizedBoardConfig, buildRandomizedPrompts } from "./helpers";
import { loadForgeSession, saveForgeSession } from "../../services/forgeSessionCache";
import { resolveBoardPoseScene } from "../../lib/boardPoseScenes";
import { normalizeBoardPlacement } from "../../lib/boardPlacement";

const ARCHETYPE_VALUES = FORGE_ARCHETYPE_OPTIONS.map((option) => option.value);
const DEFAULT_CHARACTER_BLEND = 1;

export function useForgeGeneration() {
  const { tier, canForge, generateCredits, consumeCredit, openUpgradeModal, freeCardUsed, markFreeCardUsed } = useTier();
  const { user, userProfile } = useAuth();
  const { hasFaction, unlockFaction } = useFactionDiscovery();
  const sessionOwnerKey = user?.uid ?? "guest";
  const skipNextSessionPersistRef = useRef(false);
  const [prompts, setPrompts] = useState<CardPrompts>({
    archetype: "Qu111s", rarity: "Punch Skater", style: "Corporate",
    district: "Nightshade", accentColor: "#00ff88",
    gender: "Non-binary", ageGroup: "Adult", bodyType: "Athletic",
    hairLength: "Short", skinTone: "Medium", faceCharacter: "Conventional",
  });
  const [boardConfig, setBoardConfig] = useState(DEFAULT_BOARD_CONFIG);
  const [generated, setGenerated] = useState<CardPayload | null>(() => loadForgeSession(sessionOwnerKey)?.card ?? null);
  const [characterBlend, setCharacterBlend] = useState(() => loadForgeSession(sessionOwnerKey)?.characterBlend ?? DEFAULT_CHARACTER_BLEND);
  const [forging, setForging] = useState(false);
  const [boardImageLoading, setBoardImageLoading] = useState(false);
  const [revealedFaction, setRevealedFaction] = useState<{ faction: Faction; isNew: boolean } | null>(null);
  const {
    abortGeneration,
    generateLayer,
    handleLayerError,
    hasAnyLayerUrl,
    isAnyLayerLoading,
    layers,
    replaceAbortController,
    resetLayerSession,
    setLayerParams,
    setLayers,
  } = useForgeLayers();
  const forgeClassOptions = useMemo<ForgeClassOption[]>(
    () => getForgeClassOptions({
      missionXp: userProfile?.missionXp ?? 0,
      missionOzzies: userProfile?.missionOzzies ?? 0,
    }),
    [userProfile?.missionOzzies, userProfile?.missionXp],
  );
  const availableForgeRarities = useMemo(
    () => forgeClassOptions.map((option) => option.rarity),
    [forgeClassOptions],
  );
  const selectedForgeRarity = useMemo(
    () => normalizeForgeRarity(prompts.rarity, {
      missionXp: userProfile?.missionXp ?? 0,
      missionOzzies: userProfile?.missionOzzies ?? 0,
    }),
    [prompts.rarity, userProfile?.missionOzzies, userProfile?.missionXp],
  );
  const boardPlacement = useMemo(() => {
    if (!generated) return null;
    const scene = resolveBoardPoseScene(generated.characterSeed);
    return normalizeBoardPlacement(scene.key, generated.board.placement);
  }, [generated]);

  useEffect(() => {
    if (prompts.rarity !== selectedForgeRarity) {
      setPrompts((current) => ({ ...current, rarity: selectedForgeRarity }));
    }
  }, [prompts.rarity, selectedForgeRarity]);

  // Restore the per-user forge session whenever the active auth identity changes.
  useEffect(() => {
    abortGeneration();
    skipNextSessionPersistRef.current = true;
    const session = loadForgeSession(sessionOwnerKey);
    setGenerated(session?.card ?? null);
    setCharacterBlend(session?.characterBlend ?? DEFAULT_CHARACTER_BLEND);
    setForging(false);
    setBoardImageLoading(false);
    setRevealedFaction(null);
    setLayers({
      loading: { background: false, character: false, frame: false },
      errors: [],
      ...(session?.backgroundUrl != null ? { backgroundUrl: session.backgroundUrl } : {}),
      ...(session?.characterUrl != null ? { characterUrl: session.characterUrl } : {}),
      ...(session?.frameUrl != null ? { frameUrl: session.frameUrl } : {}),
    });
  }, [abortGeneration, sessionOwnerKey, setLayers]);

  // Persist the current forge state to sessionStorage whenever it changes.
  useEffect(() => {
    if (skipNextSessionPersistRef.current) {
      skipNextSessionPersistRef.current = false;
      return;
    }
    if (!generated) return;
    saveForgeSession({
      card: generated,
      backgroundUrl: layers.backgroundUrl,
      characterUrl: layers.characterUrl,
      frameUrl: layers.frameUrl,
      characterBlend,
    }, sessionOwnerKey);
  }, [generated, layers.backgroundUrl, layers.characterUrl, layers.frameUrl, characterBlend, sessionOwnerKey]);

  const setPrompt = useCallback(<K extends keyof CardPrompts>(key: K, value: CardPrompts[K]) => {
    setPrompts((current) => ({ ...current, [key]: value }));
  }, []);

  const setArchetype = useCallback((archetype: Archetype) => {
    setPrompts((current) => ({
      ...current,
      archetype,
      style: resolveArchetypeStyle(archetype, current.style),
    }));
  }, []);

  const handleForge = useCallback(() => {
    if (!canForge) {
      openUpgradeModal();
      return;
    }
    sfxSuccessPing();

    const controller = replaceAbortController();
    const { signal } = controller;

    const forgePrompts = {
      ...prompts,
      rarity: selectedForgeRarity,
      style: resolveArchetypeStyle(prompts.archetype, prompts.style),
    };
    const displayArchetype = getForgeArchetypeLabel(forgePrompts.archetype);
    const secretFaction = tier === "free" ? null : resolveSecretFaction(forgePrompts);
    const generationPrompts =
      secretFaction === "D4rk $pider"
        ? { ...forgePrompts, archetype: "D4rk $pider" as const }
        : forgePrompts;
    const idNonce = `${user?.uid ?? "guest"}:${Date.now()}:${crypto.randomUUID()}`;
    const card = applyFactionBranding(
      generateCard(generationPrompts, { idNonce }),
      displayArchetype,
      secretFaction,
    );

    // ── Board stats & forge state (now inside buildForgedCard, but keep for board image) ─────
    const boardPoseScene = resolveBoardPoseScene(card.characterSeed);
    const cardWithBoard = {
      ...card,
      board: {
        ...card.board,
        placement: normalizeBoardPlacement(boardPoseScene.key, card.board.placement),
      },
    };
    setGenerated(cardWithBoard);
    setForging(true);
    if (secretFaction) {
      const isNew = !hasFaction(secretFaction);
      unlockFaction(secretFaction);
      setRevealedFaction({ faction: secretFaction, isNew });
    } else {
      setRevealedFaction(null);
    }

    if (tier === "free" && !freeCardUsed) {
      markFreeCardUsed();
    } else if (generateCredits > 0) {
      consumeCredit();
    }

    resetLayerSession();

    (async () => {
      setBoardImageLoading(true);
      try {
        const boardImageUrl = await generateGouacheBoard(boardConfig);
        if (signal.aborted) return;
        let finalBoardUrl = boardImageUrl;
        try {
          finalBoardUrl = (await removeBackground(boardImageUrl)).imageUrl;
        } catch (bgError) {
          console.warn("Board background removal failed, using original image:", bgError);
        }
        if (signal.aborted) return;
        setGenerated((current) => current ? {
          ...current,
          board: { ...current.board, imageUrl: finalBoardUrl },
        } : current);
      } catch (error) {
        console.warn("Board image generation failed:", error);
      } finally {
        if (!signal.aborted) setBoardImageLoading(false);
      }
    })();

    if (!isImageGenConfigured) {
      setForging(false);
      return;
    }

    const backgroundPrompt = buildBackgroundPrompt(forgePrompts.district);
    const characterPrompt = buildCharacterPrompt(forgePrompts);
    const framePrompt = buildFramePrompt(forgePrompts.rarity);
    const backgroundKey = `bg::${card.backgroundSeed}`;
    const charImageSeed = buildCharacterSeed(forgePrompts);
    const characterKey = `char::${CHARACTER_CACHE_VERSION}::${charImageSeed}`;
    const frameKey = `frame::${card.frameSeed}`;
    const charPostProcess = async (url: string) => (await removeBackground(url)).imageUrl;
    const validateCharacterLayer = createCharacterLayerValidator(CHARACTER_MIN_DIMENSIONS);
    const characterAttempts = CHARACTER_SEED_VARIANTS.map((variant) => ({
      seed: `${charImageSeed}|${variant}`,
      generationOptions: CHARACTER_GENERATION_OPTIONS,
    }));

    setLayerParams({
      background: { key: backgroundKey, prompt: backgroundPrompt, seed: card.backgroundSeed },
      character: {
        key: characterKey,
        prompt: characterPrompt,
        seed: charImageSeed,
        attempts: characterAttempts,
        postProcess: charPostProcess,
        validateResult: validateCharacterLayer,
        generationOptions: CHARACTER_GENERATION_OPTIONS,
      },
      frame: {
        key: frameKey,
        prompt: framePrompt,
        seed: card.frameSeed,
        generationOptions: { loras: [] },
      },
    });

    generateLayer("background", backgroundKey, backgroundPrompt, card.backgroundSeed, signal);
    generateLayer(
      "character",
      characterKey,
      characterPrompt,
      charImageSeed,
      signal,
      charPostProcess,
      validateCharacterLayer,
      CHARACTER_GENERATION_OPTIONS,
      characterAttempts,
    );
    generateLayer("frame", frameKey, framePrompt, card.frameSeed, signal);

    setForging(false);
  }, [
     replaceAbortController,
     boardConfig,
     canForge,
    consumeCredit,
    freeCardUsed,
    generateCredits,
    generateLayer,
    hasFaction,
    markFreeCardUsed,
    openUpgradeModal,
    prompts,
    resetLayerSession,
     setLayerParams,
     tier,
     unlockFaction,
     user?.uid,
     selectedForgeRarity,
   ]);

  const handleRandomSkater = useCallback(() => {
    sfxClick();
    setPrompts((current) => buildRandomizedPrompts(current, ARCHETYPE_VALUES, availableForgeRarities));
    setBoardConfig((current) => buildRandomizedBoardConfig(current));
  }, [availableForgeRarities]);

  const handlePreviewUpdate = useCallback((updates: { name?: string; age?: string; flavorText?: string }) => {
    setGenerated((current) => applyPreviewUpdates(current, updates));
  }, []);

  /** Shallow-merge a partial CardPayload into the generated card. */
  const patchGeneratedCard = useCallback((updates: Partial<CardPayload>) => {
    setGenerated((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  /** Deep-merge a partial identity object into the generated card's identity. */
  const patchIdentity = useCallback((updates: Partial<CardPayload["identity"]>) => {
    setGenerated((prev) =>
      prev ? { ...prev, identity: { ...prev.identity, ...updates } } : prev,
    );
  }, []);

  /** Deep-merge partial stats into the generated card. Callers should pass
   *  already-validated values (within 0–10); clamp only happens in the UI. */
  const patchStats = useCallback((updates: Partial<CardPayload["stats"]>) => {
    setGenerated((prev) =>
      prev ? { ...prev, stats: { ...prev.stats, ...updates } } : prev,
    );
  }, []);

  const setBoardPlacement = useCallback((placement: BoardPlacement) => {
    setGenerated((prev) => {
      if (!prev) return prev;
      const scene = resolveBoardPoseScene(prev.characterSeed);
      return {
        ...prev,
        board: {
          ...prev.board,
          placement: normalizeBoardPlacement(scene.key, placement),
        },
      };
    });
  }, []);

  const setBoardScale = useCallback((scale: number) => {
    setGenerated((prev) => {
      if (!prev) return prev;
      const scene = resolveBoardPoseScene(prev.characterSeed);
      const currentPlacement = normalizeBoardPlacement(scene.key, prev.board.placement);
      return {
        ...prev,
        board: {
          ...prev.board,
          placement: normalizeBoardPlacement(scene.key, { ...currentPlacement, scale }),
        },
      };
    });
  }, []);

  const handleCloseFactionReveal = useCallback(() => {
    setRevealedFaction(null);
  }, []);

  return useMemo(() => ({
    boardConfig,
    boardImageLoading,
    boardPlacement,
    canForge,
    characterBlend,
    forging,
    freeCardUsed,
    generated,
    generateCredits,
    handleCloseFactionReveal,
    handleForge,
    handleLayerError,
    handlePreviewUpdate,
    handleRandomSkater,
    hasAnyLayerUrl,
    isAnyLayerLoading,
    layers,
    openUpgradeModal,
    patchGeneratedCard,
    patchIdentity,
    patchStats,
    prompts,
    forgeClassOptions,
    revealedFaction,
    setArchetype,
    setBoardConfig,
    setBoardPlacement,
    setBoardScale,
    setCharacterBlend,
    setPrompt,
    tier,
  }), [
    boardConfig,
    boardImageLoading,
    boardPlacement,
    canForge,
    characterBlend,
    forging,
    freeCardUsed,
    generated,
    generateCredits,
    handleCloseFactionReveal,
    handleForge,
    handleLayerError,
    handlePreviewUpdate,
    handleRandomSkater,
    hasAnyLayerUrl,
    isAnyLayerLoading,
    layers,
    openUpgradeModal,
    patchGeneratedCard,
    patchIdentity,
    patchStats,
    prompts,
    forgeClassOptions,
    revealedFaction,
    setArchetype,
    setBoardConfig,
    setBoardPlacement,
    setBoardScale,
    setCharacterBlend,
    setPrompt,
    tier,
  ]);
}
