import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildCharacterSeed, generateCard } from "../../lib/generator";
import { applyFactionBranding, FORGE_ARCHETYPE_OPTIONS, getForgeArchetypeLabel, resolveSecretFaction } from "../../lib/factionDiscovery";
import { DEFAULT_BOARD_CONFIG } from "../../components/BoardBuilder";
import { calculateBoardStats } from "../../lib/boardBuilder";
import { resolveArchetypeStyle } from "../../lib/styles";
import { sfxClick, sfxError, sfxSuccess, sfxSuccessPing } from "../../lib/sfx";
import { removeBackground, isImageGenConfigured } from "../../services/imageGen";
import { generateGouacheBoard } from "../../services/boardImageGen";
import { buildBackgroundPrompt, buildCharacterPrompt, buildFramePrompt } from "../../lib/promptBuilder";
import { downloadCardAsJpg } from "../../services/cardDownload";
import { useTier } from "../../context/TierContext";
import { useAuth } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useCollection";
import { useFactionDiscovery } from "../../hooks/useFactionDiscovery";
import { TIERS } from "../../lib/tiers";
import type { Archetype, CardPayload, CardPrompts, Faction } from "../../lib/types";
import { createCharacterLayerValidator, useForgeLayers } from "./useForgeLayers";
import {
  CHARACTER_CACHE_VERSION,
  CHARACTER_GENERATION_OPTIONS,
  CHARACTER_MIN_DIMENSIONS,
  CHARACTER_SEED_VARIANTS,
} from "./constants";
import { applyPreviewUpdates, buildRandomizedBoardConfig, buildRandomizedPrompts } from "./helpers";

const ARCHETYPE_VALUES = FORGE_ARCHETYPE_OPTIONS.map((option) => option.value);

export function useCardForgeController() {
  const { tier, canForge, generateCredits, consumeCredit, openUpgradeModal, freeCardUsed, markFreeCardUsed } = useTier();
  const { user } = useAuth();
  const { addCard, cards } = useCollection();
  const { hasFaction, unlockFaction } = useFactionDiscovery();
  const tierData = TIERS[tier];
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<CardPrompts>({
    archetype: "Qu111s", rarity: "Punch Skater", style: "Corporate",
    district: "Nightshade", accentColor: "#00ff88",
    gender: "Non-binary", ageGroup: "Adult", bodyType: "Athletic",
    hairLength: "Short", skinTone: "Medium", faceCharacter: "Conventional",
  });
  const [boardConfig, setBoardConfig] = useState(DEFAULT_BOARD_CONFIG);
  const [generated, setGenerated] = useState<CardPayload | null>(null);
  const [characterBlend, setCharacterBlend] = useState(1);
  const [forging, setForging] = useState(false);
  const [viewing3D, setViewing3D] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<CardPayload | null>(null);
  const [isFirstCard, setIsFirstCard] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [revealedFaction, setRevealedFaction] = useState<{ faction: Faction; isNew: boolean } | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem("forge-welcome-dismissed") !== "1");
  const {
    abortRef,
    generateLayer,
    handleLayerError,
    hasAnyLayerUrl,
    isAnyLayerLoading,
    layers,
    resetLayerSession,
    setLayerParams,
  } = useForgeLayers();

  const closeWelcome = useCallback(() => {
    localStorage.setItem("forge-welcome-dismissed", "1");
    setShowWelcome(false);
  }, []);

  useEffect(() => {
    if (!showWelcome) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWelcome();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showWelcome, closeWelcome]);

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

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const forgePrompts = { ...prompts, style: resolveArchetypeStyle(prompts.archetype, prompts.style) };
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
    const cardWithBoard = { ...card, board: boardConfig, boardLoadout: calculateBoardStats(boardConfig) };
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

    if (!isImageGenConfigured) {
      setForging(false);
      return;
    }

    const backgroundPrompt = buildBackgroundPrompt(forgePrompts.district);
    const characterPrompt = buildCharacterPrompt(forgePrompts);
    const framePrompt = buildFramePrompt(prompts.rarity);
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

    (async () => {
      try {
        const boardImageUrl = await generateGouacheBoard(boardConfig);
        if (signal.aborted) return;
        setGenerated((current) => (current ? { ...current, boardImageUrl } : current));
      } catch (error) {
        console.warn("Board image generation failed:", error);
      }
    })();

    setForging(false);
  }, [
    abortRef,
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
  ]);

  const handleSaveToCollection = useCallback(async () => {
    if (!generated) return;
    if (!tierData.canSave) {
      openUpgradeModal();
      return;
    }

    if (tierData.cardLimit !== null && cards.length >= tierData.cardLimit) {
      openUpgradeModal();
      return;
    }

    setSaving(true);
    setSaveError(null);
    const firstCard = cards.length === 0;
    const cardToSave: CardPayload = {
      ...generated,
      ...(layers.backgroundUrl != null ? { backgroundImageUrl: layers.backgroundUrl } : {}),
      ...(layers.characterUrl != null ? { characterImageUrl: layers.characterUrl } : {}),
      ...(layers.frameUrl != null ? { frameImageUrl: layers.frameUrl } : {}),
    };

    try {
      await addCard(cardToSave);
      sfxSuccess();
      setIsFirstCard(firstCard);
      setSavedCard(cardToSave);
    } catch (error) {
      console.error("Failed to save card:", error);
      sfxError();
      setSaveError("Failed to save card. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [addCard, cards.length, generated, layers, openUpgradeModal, tierData]);

  const handleDownloadJpg = useCallback(async () => {
    if (!generated) return;
    setDownloading(true);
    try {
      await downloadCardAsJpg(
        generated.identity.name,
        generated.prompts.rarity,
        layers.backgroundPrintUrl ?? layers.backgroundUrl,
        layers.characterUrl,
        layers.frameUrl,
        generated.frameSeed,
        characterBlend,
      );
    } catch (error) {
      console.error("Card JPG download failed:", error);
    } finally {
      setDownloading(false);
    }
  }, [characterBlend, generated, layers]);

  const handleRandomSkater = useCallback(() => {
    sfxClick();
    setPrompts((current) => buildRandomizedPrompts(current, ARCHETYPE_VALUES));
    setBoardConfig((current) => buildRandomizedBoardConfig(current));
  }, []);

  const handleReopenWelcome = useCallback(() => {
    localStorage.removeItem("forge-welcome-dismissed");
    setShowWelcome(true);
  }, []);

  const handleOpen3D = useCallback(() => {
    sfxClick();
    setViewing3D(true);
  }, []);

  const handleClose3D = useCallback(() => {
    setViewing3D(false);
  }, []);

  const handleOpenPrint = useCallback(() => {
    sfxClick();
    setPrinting(true);
  }, []);

  const handleClosePrint = useCallback(() => {
    setPrinting(false);
  }, []);

  const handleCloseFactionReveal = useCallback(() => {
    setRevealedFaction(null);
  }, []);

  const handleCollectionNavigation = useCallback(() => {
    setSavedCard(null);
    navigate("/collection");
  }, [navigate]);

  const handleOpenFactions = useCallback(() => {
    setRevealedFaction(null);
    navigate("/factions");
  }, [navigate]);

  const handlePreviewUpdate = useCallback((updates: { name?: string; age?: number; flavorText?: string }) => {
    setGenerated((current) => applyPreviewUpdates(current, updates));
  }, []);

  return useMemo(() => ({
    boardConfig,
    canForge,
    characterBlend,
    closeWelcome,
    downloading,
    forging,
    freeCardUsed,
    generated,
    generateCredits,
    handleClose3D,
    handleCloseFactionReveal,
    handleClosePrint,
    handleCollectionNavigation,
    handleDownloadJpg,
    handleForge,
    handleOpen3D,
    handleOpenFactions,
    handleOpenPrint,
    handlePreviewUpdate,
    handleRandomSkater,
    handleReopenWelcome,
    handleSaveToCollection,
    hasAnyLayerUrl,
    isAnyLayerLoading,
    isFirstCard,
    layers,
    openUpgradeModal,
    printing,
    prompts,
    revealedFaction,
    saveError,
    savedCard,
    saving,
    setArchetype,
    setBoardConfig,
    setCharacterBlend,
    setPrompt,
    showWelcome,
    tier,
    tierCanSave: tierData.canSave,
    viewing3D,
    handleLayerError,
  }), [
    boardConfig,
    canForge,
    characterBlend,
    closeWelcome,
    downloading,
    forging,
    freeCardUsed,
    generated,
    generateCredits,
    handleClose3D,
    handleCloseFactionReveal,
    handleClosePrint,
    handleCollectionNavigation,
    handleDownloadJpg,
    handleForge,
    handleLayerError,
    handleOpen3D,
    handleOpenFactions,
    handleOpenPrint,
    handlePreviewUpdate,
    handleRandomSkater,
    handleReopenWelcome,
    handleSaveToCollection,
    hasAnyLayerUrl,
    isAnyLayerLoading,
    isFirstCard,
    layers,
    openUpgradeModal,
    printing,
    prompts,
    revealedFaction,
    saveError,
    savedCard,
    saving,
    setArchetype,
    setPrompt,
    showWelcome,
    tier,
    tierData.canSave,
    viewing3D,
  ]);
}
