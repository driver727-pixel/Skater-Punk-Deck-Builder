# Board Component Assets

Static PNG images used by the board builder.

---

## BoardComposite layers (`public/assets/boards/`)

These are the **assembled-board overlay** images rendered by `BoardComposite`
(visible on the character card).  Each file uses the `<seedKey>.png` naming
convention defined in `BOARD_COMPONENT_CATALOG` inside
`src/lib/boardBuilder.ts`.

### Expected files

| seedKey                           | Component            |
|-----------------------------------|----------------------|
| `deck-carbon-street-drop-through` | Street deck          |
| `deck-bamboo-at-top-mount`        | AT deck              |
| `deck-off-grid-mountain-board`    | Mountain deck        |
| `deck-swallowtail-surf-skate`     | Surf deck            |
| `wheel-100mm-urethane-street`     | Urethane wheels      |
| `wheel-175mm-pneumatic-at`        | Pneumatic wheels     |
| `wheel-120mm-cloud-sliders`       | Cloud / rubber wheels|
| `drivetrain-dual-belt-drive`      | Belt drive trucks    |
| `drivetrain-sealed-gear-drive`    | Gear drive trucks    |
| `drivetrain-stealth-hub-motors`   | Hub motor trucks     |
| `battery-slim-stealth-pack`       | Slim Stealth battery |
| `battery-double-stack-brick`      | Double-Stack battery |
| `battery-top-mounted-peli-case`   | Top-Mounted Peli Case|

### Workflow

1. Open **Card Forge → Asset Generator** (admin only, `/dev/asset-generator`).
2. Click **⚡ Generate All** (or generate individual items).
3. Once images appear, click **⬇ Download** on each card — the browser will
   save the file with the correct `<seedKey>.png` filename automatically.
   Alternatively click **⬇ Download All** at the top to save every completed
   image in one pass.
4. Move the downloaded files to this folder (`public/assets/boards/`).

Until the PNGs are placed here the `BoardComposite` layers are simply invisible
(the component renders `null` when all URLs are absent).

---

## BoardPreviewGrid images (`src/assets/boards/<category>/`)

These are the **component grid preview** images shown in the composition box
above the conveyor belts inside the board builder.

### Motor images (new!)

Upload any `.png` files into:

```
src/assets/boards/motor/
```

File names do **not** need to follow a specific convention — use any descriptive
name you like (e.g. `micro-motor.png`, `outrunner.png`).

When a rider selects a motor on the belt, the composition box will **randomly
pick one of the uploaded images** to display for visual immersion.

### All category folders

| Folder                              | Shown when…             |
|-------------------------------------|-------------------------|
| `src/assets/boards/deck/`           | Any deck type is active |
| `src/assets/boards/drivetrain/`     | Any drivetrain is active|
| `src/assets/boards/motor/`          | Any motor is active     |
| `src/assets/boards/wheels/`         | Any wheel type is active|
| `src/assets/boards/battery/`        | Any battery is active   |

### Rules

* Any number of `.png` files is fine — one image per folder is enough.
* After adding images, **commit and rebuild** the app; Vite picks them up at
  build time.
* Each `.gitkeep` file in these folders exists only to keep the folder tracked
  by Git — you can leave it in place alongside your images.

### Fallback behaviour

If a category folder is empty (no PNGs committed yet), the composition box
falls back to checking `public/assets/boards/<category>/<OptionValue>.png`
(e.g. `public/assets/boards/motor/Standard.png`).  If that file is also absent
the tile shows an icon placeholder.

