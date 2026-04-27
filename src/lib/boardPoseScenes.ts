import { createSeededRandom } from "./prng";

export type BoardPoseSceneKey = "workshop" | "loadout" | "airborne" | "showcase";

export interface BoardPoseScene {
  key: BoardPoseSceneKey;
  characterPrompt: string;
}

export const BOARD_POSE_SCENES: BoardPoseScene[] = [
  {
    key: "workshop",
    characterPrompt:
      "repairing, painting, charging, or admiring a separate exact board asset in a hands-on workshop action beat; aim the hands and gaze toward open lower-foreground board space, but do not draw or invent any skateboard deck, trucks, or wheels",
  },
  {
    key: "loadout",
    characterPrompt:
      "standing in a dynamic hero pose while presenting open side space where a separate exact board asset will float beside or behind them like loadout gear; do not draw or invent any skateboard deck, trucks, or wheels",
  },
  {
    key: "airborne",
    characterPrompt:
      "jumping, punching, or mid-trick in the air above open lower-frame space reserved for a separate exact board asset composited below; do not draw or invent any skateboard deck, trucks, or wheels",
  },
  {
    key: "showcase",
    characterPrompt:
      "standing in an expressive courier pose next to open display space for a separate exact board asset on the ground, a rack, a wall mount, or a pedestal; do not draw or invent any skateboard deck, trucks, or wheels",
  },
];

export function resolveBoardPoseScene(seed: string): BoardPoseScene {
  return createSeededRandom(`${seed}|exact-board-scene`).pick(BOARD_POSE_SCENES);
}
