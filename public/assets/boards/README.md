# Board Component Assets

Static PNG images for the `BoardComposite` component.

Each file is a **square, green-screen** product photograph exported from the
Asset Generator (`/dev/asset-generator`), with the background removed via the
`removeBackground` utility (fal.ai birefernet).

## Naming convention

```
<seedKey>.png
```

The `seedKey` values are defined in `src/lib/boardBuilder.ts`
(`BOARD_COMPONENT_CATALOG[].seedKey`).

### Expected files

| seedKey                           | Component    |
|-----------------------------------|--------------|
| `deck-carbon-street-drop-through` | Street deck  |
| `deck-bamboo-at-top-mount`        | AT deck      |
| `deck-off-grid-mountain-board`    | Mountain deck|
| `deck-swallowtail-surf-skate`     | Surf deck    |
| `wheel-100mm-urethane-street`     | Urethane wheels |
| `wheel-175mm-pneumatic-at`        | Pneumatic wheels |
| `wheel-120mm-cloud-sliders`       | Rubber / cloud wheels |
| `drivetrain-dual-belt-drive`      | Belt drive trucks |
| `drivetrain-sealed-gear-drive`    | Gear drive trucks |
| `drivetrain-stealth-hub-motors`   | Hub motor trucks  |
| `battery-slim-stealth-pack`       | Slim Stealth battery |
| `battery-double-stack-brick`      | Double-Stack battery |
| `battery-top-mounted-peli-case`   | Top-Mounted Peli Case |

## Workflow

1. Open **Card Forge → Asset Generator** (admin only, `/dev/asset-generator`).
2. Click **⚡ Generate All** (or generate individual items).
3. Once images appear, click **⬇ Download** on each card — the browser will save
   the file with the correct `<seedKey>.png` filename automatically.
   Alternatively click **⬇ Download All** at the top to save every completed
   image in one pass.
4. Move the downloaded files to this folder (`public/assets/boards/`).

Until the PNGs are placed here the `BoardComposite` layers are simply invisible
(the component renders `null` when all URLs are absent).
