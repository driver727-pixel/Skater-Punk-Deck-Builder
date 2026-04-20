import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sfxClick } from "../../lib/sfx";

interface UseForgeNavigationOptions {
  onBeforeCollectionNavigation: () => void;
  onBeforeFactionsNavigation: () => void;
}

export function useForgeNavigation({
  onBeforeCollectionNavigation,
  onBeforeFactionsNavigation,
}: UseForgeNavigationOptions) {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem("forge-welcome-dismissed") !== "1");
  const [viewing3D, setViewing3D] = useState(false);
  const [printing, setPrinting] = useState(false);

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

  const handleCollectionNavigation = useCallback(() => {
    onBeforeCollectionNavigation();
    navigate("/collection");
  }, [navigate, onBeforeCollectionNavigation]);

  const handleOpenFactions = useCallback(() => {
    onBeforeFactionsNavigation();
    navigate("/factions");
  }, [navigate, onBeforeFactionsNavigation]);

  return useMemo(() => ({
    closeWelcome,
    handleClose3D,
    handleClosePrint,
    handleCollectionNavigation,
    handleOpen3D,
    handleOpenFactions,
    handleOpenPrint,
    handleReopenWelcome,
    printing,
    showWelcome,
    viewing3D,
  }), [
    closeWelcome,
    handleClose3D,
    handleClosePrint,
    handleCollectionNavigation,
    handleOpen3D,
    handleOpenFactions,
    handleOpenPrint,
    handleReopenWelcome,
    printing,
    showWelcome,
    viewing3D,
  ]);
}
