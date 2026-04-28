import type { CSSProperties } from "react";
import type { BoardPlacement } from "./types";
import type { BoardPoseSceneKey } from "./boardPoseScenes";

export const BOARD_PLACEMENT_MIN_SCALE = 0.5;
export const BOARD_PLACEMENT_MAX_SCALE = 1.4;
export const BOARD_PLACEMENT_SCALE_STEP = 0.05;

interface BoardPlacementPreset extends BoardPlacement {
  widthPercent: number;
  heightPercent: number;
}

const BOARD_PLACEMENT_PRESETS: Record<BoardPoseSceneKey, BoardPlacementPreset> = {
  workshop: { xPercent: 38, yPercent: 77.5, scale: 1, rotationDeg: -9, widthPercent: 68, heightPercent: 25 },
  loadout: { xPercent: 75, yPercent: 46, scale: 1, rotationDeg: 8, widthPercent: 48, heightPercent: 30 },
  airborne: { xPercent: 50, yPercent: 81, scale: 1, rotationDeg: -10, widthPercent: 64, heightPercent: 24 },
  showcase: { xPercent: 69.5, yPercent: 75.5, scale: 1, rotationDeg: 3, widthPercent: 57, heightPercent: 25 },
  painting: { xPercent: 37.5, yPercent: 75.5, scale: 1, rotationDeg: -8, widthPercent: 67, heightPercent: 25 },
  wheels: { xPercent: 47, yPercent: 80.5, scale: 1, rotationDeg: -5, widthPercent: 70, heightPercent: 27 },
  cleaning: { xPercent: 67, yPercent: 77, scale: 1, rotationDeg: 5, widthPercent: 60, heightPercent: 24 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteOrDefault(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function getDefaultBoardPlacement(sceneKey: BoardPoseSceneKey): BoardPlacement {
  const preset = BOARD_PLACEMENT_PRESETS[sceneKey];
  return {
    xPercent: preset.xPercent,
    yPercent: preset.yPercent,
    scale: preset.scale,
    rotationDeg: preset.rotationDeg,
  };
}

export function getBoardPlacementBox(sceneKey: BoardPoseSceneKey, scale: number): { widthPercent: number; heightPercent: number } {
  const preset = BOARD_PLACEMENT_PRESETS[sceneKey];
  const clampedScale = clamp(scale, BOARD_PLACEMENT_MIN_SCALE, BOARD_PLACEMENT_MAX_SCALE);
  return {
    widthPercent: preset.widthPercent * clampedScale,
    heightPercent: preset.heightPercent * clampedScale,
  };
}

export function normalizeBoardPlacement(
  sceneKey: BoardPoseSceneKey,
  placement?: Partial<BoardPlacement>,
): BoardPlacement {
  const fallback = getDefaultBoardPlacement(sceneKey);
  const scale = clamp(
    finiteOrDefault(placement?.scale, fallback.scale),
    BOARD_PLACEMENT_MIN_SCALE,
    BOARD_PLACEMENT_MAX_SCALE,
  );
  const box = getBoardPlacementBox(sceneKey, scale);
  const xMin = box.widthPercent / 2;
  const xMax = 100 - xMin;
  const yMin = box.heightPercent / 2;
  const yMax = 100 - yMin;

  return {
    xPercent: clamp(finiteOrDefault(placement?.xPercent, fallback.xPercent), xMin, xMax),
    yPercent: clamp(finiteOrDefault(placement?.yPercent, fallback.yPercent), yMin, yMax),
    scale,
    rotationDeg: finiteOrDefault(placement?.rotationDeg, fallback.rotationDeg),
  };
}

export function buildBoardPlacementStyle(
  sceneKey: BoardPoseSceneKey,
  placement?: Partial<BoardPlacement>,
): CSSProperties {
  const normalized = normalizeBoardPlacement(sceneKey, placement);
  const box = getBoardPlacementBox(sceneKey, normalized.scale);

  return {
    left: `${normalized.xPercent}%`,
    top: `${normalized.yPercent}%`,
    width: `${box.widthPercent}%`,
    height: `${box.heightPercent}%`,
    transform: `translate(-50%, -50%) rotate(${normalized.rotationDeg}deg)`,
  };
}
