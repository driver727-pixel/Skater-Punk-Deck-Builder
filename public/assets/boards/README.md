# Board Component Assets

Static PNG images for the `BoardComposite` component.

Each file is a **square, green-screen** product photograph exported from the
Asset Generator (`/dev/asset-generator`), with the background removed via the
`removeBackground` utility (fal.ai birefrence).

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

## Workflow

1. Open **Card Forge → Asset Generator** (admin only).
2. Click **Generate All** (or generate individual items).
3. Right-click each preview image → **Save image as…** → save to this folder
   with the matching `<seedKey>.png` filename.

Until the PNGs are placed here the `BoardComposite` layers are simply invisible
(the component renders `null` when all URLs are absent).
