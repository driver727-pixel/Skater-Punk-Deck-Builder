import { createSeededRandom } from "./prng";

export type BoardPoseSceneKey = "workshop" | "loadout" | "airborne" | "showcase";

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
      `repairing, painting, charging, or admiring a separate exact board asset in a hands-on workshop action beat; aim the hands and gaze toward open lower-foreground board space, but ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "repairing, painting, charging, or admiring an electric skateboard in a hands-on workshop action beat",
  },
  {
    key: "loadout",
    characterPrompt:
      `standing in a dynamic hero pose while presenting open side space where a separate exact board asset will float beside or behind them like loadout gear; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "standing in a dynamic hero pose while an electric skateboard floats beside or behind them like loadout gear",
  },
  {
    key: "airborne",
    characterPrompt:
      `jumping, punching, or mid-trick in the air above open lower-frame space reserved for a separate exact board asset composited below; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "jumping, punching, or mid-trick in the air above an electric skateboard below",
  },
  {
    key: "showcase",
    characterPrompt:
      `standing in an expressive courier pose next to open display space for a separate exact board asset on the ground, a rack, a wall mount, or a pedestal; ${NO_CHARACTER_LAYER_BOARD}`,
    imagePrompt:
      "standing in an expressive courier pose next to an electric skateboard on the ground, a rack, a wall mount, or a pedestal",
  },
];

export function resolveBoardPoseScene(seed: string): BoardPoseScene {
  return createSeededRandom(`${seed}|exact-board-scene`).pick(BOARD_POSE_SCENES);
}
