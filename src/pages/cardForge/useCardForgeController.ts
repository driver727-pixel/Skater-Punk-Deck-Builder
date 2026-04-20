import { useMemo } from "react";
import { useForgeGeneration } from "./useForgeGeneration";
import { useForgeNavigation } from "./useForgeNavigation";
import { useForgeSave } from "./useForgeSave";

export function useCardForgeController() {
  const forge = useForgeGeneration();
  const save = useForgeSave({
    characterBlend: forge.characterBlend,
    generated: forge.generated,
    layers: forge.layers,
    openUpgradeModal: forge.openUpgradeModal,
    tier: forge.tier,
  });
  const navigation = useForgeNavigation({
    onBeforeCollectionNavigation: save.clearSavedCard,
    onBeforeFactionsNavigation: forge.handleCloseFactionReveal,
  });

  return useMemo(() => ({
    ...forge,
    ...navigation,
    ...save,
  }), [forge, navigation, save]);
}
