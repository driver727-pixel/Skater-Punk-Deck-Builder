import { createSeededRandom } from "./prng";

export type BoardPoseSceneKey = "workshop" | "loadout" | "airborne" | "showcase" | "painting" | "wheels" | "cleaning";

export interface BoardPoseScene {
  key: BoardPoseSceneKey;
  characterPrompt: string;
  imagePrompt: string;
}

const NO_CHARACTER_LAYER_BOARD =
  "do not draw or invent any skateboard deck, trucks, or wheels";

export const BOARD_POSE_SCENES: BoardPoseScene[] = [
  {
    key: "workshop",
    characterPrompt:
      `crouching or kneeling, both hands working in the lower-left foreground just below frame — tightening a bolt, adjusting a truck, or testing a component — gaze aimed downward at the work; hands-on repair pose; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "crouching and tightening a truck bolt or repairing a component on their electric skateboard, focused hands-on workshop repair pose",
  },
  {
    key: "loadout",
    characterPrompt:
      `standing in a confident hero stance — arms crossed, fist raised, or one arm extended — with clear open space on the right side where the board hangs like mission loadout gear; gaze forward or slightly to the side; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "standing in a confident hero loadout stance, electric skateboard mounted on the wall or propped upright beside them like essential mission gear",
  },
  {
    key: "airborne",
    characterPrompt:
      `fully airborne — launched high with bent knees, arm thrown out for balance, or throwing a punch mid-flight — body elevated well above the lower frame; aggressive athletic air pose with strong upward energy; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "launched fully airborne mid-trick, body high in the air above their electric skateboard below, bent knees and arms out for balance",
  },
  {
    key: "showcase",
    characterPrompt:
      `standing upright with a satisfied smile or impressed gaze, one hand gesturing or pointing proudly toward the lower-right display area; weight shifted to one hip, relaxed proud stance directed at the board zone; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "standing proudly and gesturing admiringly toward their electric skateboard on display, satisfied smile, one hand pointing at their board",
  },
  {
    key: "painting",
    characterPrompt:
      `crouching low or kneeling, brush or spray can in hand, applying careful strokes to the deck area in the lower-left foreground; head tilted with concentration, tongue at corner of mouth, free hand steadying; creative focused expression; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "crouching and painting or spray-painting custom artwork onto their electric skateboard deck, brush or spray can in hand, focused creative expression",
  },
  {
    key: "wheels",
    characterPrompt:
      `squatting or kneeling with both hands reaching toward the lower-center foreground — skate tool or wrench in one hand — pulling off or fitting a wheel; gaze down and concentrated on the mechanical work; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "kneeling and swapping out a wheel on their electric skateboard, skate tool in hand, focused mechanical work pose",
  },
  {
    key: "cleaning",
    characterPrompt:
      `bent forward or kneeling, cloth or soft brush in hand, wiping down and polishing the deck surface in open lower-right frame space; deliberate care in every stroke, free hand steadying; meticulous detailing pose; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "carefully wiping down and polishing their electric skateboard deck, cloth in hand, meticulous detailing pose",
  },
];

export function resolveBoardPoseScene(seed: string): BoardPoseScene {
  return createSeededRandom(`${seed}|exact-board-scene`).pick(BOARD_POSE_SCENES);
}
