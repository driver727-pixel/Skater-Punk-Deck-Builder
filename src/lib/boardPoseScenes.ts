import { createSeededRandom } from "./prng";

export type BoardPoseSceneKey = "workshop" | "loadout" | "airborne" | "showcase";

export interface BoardPoseScene {
  key: BoardPoseSceneKey;
  characterPrompt: string;
  imagePrompt: string;
}

export const BOARD_POSE_SCENES: BoardPoseScene[] = [
  {
    key: "workshop",
    characterPrompt:
      "repairing, painting, charging, or admiring a separate exact board asset in a hands-on workshop action beat; aim the hands and gaze toward open lower-foreground board space, but do not draw or invent any skateboard deck, trucks, or wheels",
    imagePrompt:
      "repairing, painting, charging, or admiring an electric skateboard in a hands-on workshop action beat",
  },
  {
    key: "loadout",
    characterPrompt:
      "standing in a dynamic hero pose while presenting open side space where a separate exact board asset will float beside or behind them like loadout gear; do not draw or invent any skateboard deck, trucks, or wheels",
    imagePrompt:
      "standing in a dynamic hero pose while an electric skateboard floats beside or behind them like loadout gear",
  },
  {
    key: "airborne",
    characterPrompt:
      "jumping, punching, or mid-trick in the air above open lower-frame space reserved for a separate exact board asset composited below; do not draw or invent any skateboard deck, trucks, or wheels",
    imagePrompt:
      "jumping, punching, or mid-trick in the air above an electric skateboard below",
  },
  {
    key: "showcase",
    characterPrompt:
      "standing in an expressive courier pose next to open display space for a separate exact board asset on the ground, a rack, a wall mount, or a pedestal; do not draw or invent any skateboard deck, trucks, or wheels",
    imagePrompt:
      "standing in an expressive courier pose next to an electric skateboard on the ground, a rack, a wall mount, or a pedestal",
  },
];

export function resolveBoardPoseScene(seed: string): BoardPoseScene {
  return createSeededRandom(`${seed}|exact-board-scene`).pick(BOARD_POSE_SCENES);
}
