import type { WorldLocation } from "./types";

export interface AtlasDistrictLayout {
  x: number;
  y: number;
  tone: string;
}

export interface AtlasArtery {
  from: WorldLocation;
  to: WorldLocation;
  label: string;
  color: string;
  shadowColor: string;
  via?: { x: number; y: number };
}

export const AUSTRALIA_DISTRICT_LAYOUT: Record<WorldLocation, AtlasDistrictLayout> = {
  Airaway: { x: 70, y: 58, tone: "sky" },
  Electropolis: { x: 78, y: 41, tone: "signal" },
  "Glass City": { x: 25, y: 67, tone: "glass" },
  "The Grid": { x: 67, y: 64, tone: "grid" },
  Batteryville: { x: 34, y: 36, tone: "industrial" },
  "The Roads": { x: 45, y: 57, tone: "roads" },
  Nightshade: { x: 67, y: 79, tone: "underground" },
  "The Forest": { x: 76, y: 25, tone: "wild" },
};

export const DISTRICT_ARTERIES: AtlasArtery[] = [
  {
    from: "Airaway",
    to: "The Grid",
    label: "Mag-Rail Spine",
    color: "#00ffb4",
    shadowColor: "rgba(0, 255, 180, 0.72)",
    via: { x: 70, y: 64 },
  },
  {
    from: "The Grid",
    to: "Glass City",
    label: "Data Artery",
    color: "#9a7dff",
    shadowColor: "rgba(154, 125, 255, 0.7)",
    via: { x: 25, y: 64 },
  },
  {
    from: "The Grid",
    to: "Batteryville",
    label: "Power Conduit",
    color: "#ff8b3d",
    shadowColor: "rgba(255, 139, 61, 0.72)",
    via: { x: 67, y: 36 },
  },
  {
    from: "Batteryville",
    to: "The Roads",
    label: "Freight Artery",
    color: "#7cf57d",
    shadowColor: "rgba(124, 245, 125, 0.68)",
    via: { x: 45, y: 36 },
  },
  {
    from: "The Roads",
    to: "Nightshade",
    label: "Underpass Tunnel",
    color: "#c86bff",
    shadowColor: "rgba(200, 107, 255, 0.68)",
  },
  {
    from: "The Roads",
    to: "The Forest",
    label: "Timber Route",
    color: "#8bffce",
    shadowColor: "rgba(139, 255, 206, 0.68)",
    via: { x: 45, y: 25 },
  },
];

function interp(from: number, to: number, t: number): string {
  return (from + (to - from) * t).toFixed(2);
}

export function getAtlasRoutePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  via?: { x: number; y: number },
): string {
  if (!via) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  const t = 0.3;
  const p1x = interp(via.x, start.x, t);
  const p1y = interp(via.y, start.y, t);
  const p2x = interp(via.x, end.x, t);
  const p2y = interp(via.y, end.y, t);
  return `M ${start.x} ${start.y} L ${p1x} ${p1y} Q ${via.x} ${via.y} ${p2x} ${p2y} L ${end.x} ${end.y}`;
}
