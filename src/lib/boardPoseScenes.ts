import { createSeededRandom } from "./prng";

export type BoardPoseSceneKey = "workshop" | "loadout" | "airborne" | "showcase" | "painting" | "wheels" | "cleaning";

export interface BoardPoseScene {
  key: BoardPoseSceneKey;
  characterPrompt: string;
  imagePrompt: string;
}

const NO_CHARACTER_LAYER_BOARD =
  "do not draw or invent any skateboard deck, trucks, or wheels; no second skateboard, no background skateboard, no distant skater";

export const BOARD_POSE_SCENES: BoardPoseScene[] = [
  {
    key: "workshop",
    characterPrompt:
      `crouching or kneeling slightly left of center, both hands working low in the foreground without covering a full skateboard-sized gap kept visible near the feet — tightening a bolt, adjusting a truck, or testing a component — gaze aimed downward at the work; functional hands-on repair pose; keep the body pulled slightly back from the camera with visible boots and clear negative space for board compositing; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "crouching beside their full electric skateboard and tightening a truck bolt or repairing a component, focused hands-on workshop repair pose, board fully visible in frame",
  },
  {
    key: "loadout",
    characterPrompt:
      `standing slightly left of center in a confident hero stance — arms crossed, fist raised, or one arm extended — with the full right side kept clear from shoulder to boots so a skateboard can sit fully visible beside them like mission loadout gear; gaze forward or slightly to the side; keep the figure zoomed out with comfortable headroom and open space around the legs; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "standing in a confident hero loadout stance with their full electric skateboard upright beside them like essential mission gear, fully visible in frame",
  },
  {
    key: "airborne",
    characterPrompt:
      `fully airborne — launched high with bent knees, arm thrown out for balance, or throwing a punch mid-flight — body elevated well above the lower half of the frame; aggressive athletic air pose with strong upward energy; leave the lower frame open so a full skateboard can read clearly beneath or beside the body; keep the subject zoomed out with visible boots and clean negative space; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "launched fully airborne mid-trick, body high in the air above their electric skateboard below, bent knees and arms out for balance, full board clearly visible in frame",
  },
  {
    key: "showcase",
    characterPrompt:
      `standing slightly left of center with a satisfied smile or impressed gaze, one hand gesturing or pointing proudly toward a clean display area on the right; weight shifted to one hip, relaxed proud stance directed at the board zone; keep enough empty space for a full skateboard to remain completely visible beside them; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "standing proudly and gesturing admiringly toward their electric skateboard on display beside them, satisfied smile, one hand pointing at their full board",
  },
  {
    key: "painting",
    characterPrompt:
      `crouching low or kneeling beside a clear deck-sized zone in the lower foreground, brush or spray can in hand, applying careful strokes while keeping the board area readable and unobstructed; head tilted with concentration, free hand steadying without blocking the full board silhouette; creative focused expression; keep the body pulled back from the camera with visible boots; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "crouching beside their full electric skateboard and painting or spray-painting custom artwork onto the visible deck, brush or spray can in hand, focused creative expression",
  },
  {
    key: "wheels",
    characterPrompt:
      `squatting or kneeling with both hands reaching toward a clear service area in the lower-center foreground — skate tool or wrench in one hand — pulling off or fitting a wheel while keeping the full board silhouette visible; gaze down and concentrated on the mechanical work; keep the body slightly offset so the board can sit fully inside frame; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "kneeling beside their full electric skateboard and swapping out a wheel, skate tool in hand, focused mechanical work pose, board fully visible in frame",
  },
  {
    key: "cleaning",
    characterPrompt:
      `bent forward or kneeling beside an open board-sized space on the right, cloth or soft brush in hand, wiping down and polishing while leaving the full skateboard silhouette readable next to them; deliberate care in every stroke, free hand steadying without covering the board zone; meticulous detailing pose; keep the figure zoomed out with visible boots; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "carefully wiping down and polishing their full electric skateboard beside them, cloth in hand, meticulous detailing pose, board fully visible in frame",
  },
];

export function resolveBoardPoseScene(seed: string): BoardPoseScene {
  return createSeededRandom(`${seed}|exact-board-scene`).pick(BOARD_POSE_SCENES);
}
