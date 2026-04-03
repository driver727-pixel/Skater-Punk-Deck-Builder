import type { CardPayload } from "../lib/types";

interface CardArtProps {
  card: CardPayload;
  width?: number;
  height?: number;
}

const DISTRICT_COLORS: Record<string, string> = {
  "Neon District": "#ff00aa",
  "The Sprawl": "#ff6600",
  "Chrome Heights": "#88ccff",
  "Undercity": "#aa44ff",
  "Corporate Core": "#00ccff",
};

const RARITY_STARS: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Legendary: 4,
};

/**
 * Deterministic pseudo-random float in [0, 1) from a string seed + integer index.
 * Uses a fast multiply-xor-shift hash so cards render identically on every re-render
 * (replacing the previous Math.random() calls that caused window lights to flicker).
 */
function seededVal(seed: string, idx: number): number {
  let h = idx * 2654435761;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2246822519);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  // Modulo 1000 then divide: maps the 32-bit unsigned value to three decimal places in [0, 1)
  return ((h >>> 0) % 1000) / 1000;
}

// Jacket style → torso fill color
const JACKET_COLORS: Record<string, string> = {
  Synthleather: "#1e1e3a",
  ChromeVest:   "#2a2a3a",
  NeonStripe:   "#1a2030",
  DataWeave:    "#0f2a2a",
  SteelMesh:    "#252530",
};

// Board style → deck color / stripe
const BOARD_COLORS: Record<string, string> = {
  "Slick-90":    "#1a1a2e",
  VortexDeck:    "#1a1422",
  GhostRide:     "#141428",
  NeonCruiser:   "#0a1a1a",
  IronSlider:    "#1a1a20",
};

interface BackgroundProps {
  width: number;
  height: number;
  districtColor: string;
  seed: string;
  uid: string;
}

function CityscapeBackground({ width, height, districtColor, seed, uid }: BackgroundProps) {
  // Mid-ground buildings (slightly taller, lighter fill)
  const midBuildings = [
    { x: 5,   w: 25, h: 70 },
    { x: 55,  w: 30, h: 85 },
    { x: 110, w: 28, h: 75 },
    { x: 168, w: 32, h: 80 },
  ];

  // Foreground buildings (darker, deeper silhouette)
  const fgBuildings = [
    { x: 0,   w: 30, h: 80 },
    { x: 28,  w: 20, h: 60 },
    { x: 46,  w: 35, h: 100 },
    { x: 79,  w: 25, h: 70 },
    { x: 102, w: 40, h: 90 },
    { x: 140, w: 22, h: 55 },
    { x: 160, w: 38, h: 95 },
  ];

  const horizon = height * 0.55;

  // Deterministic stars
  const stars = Array.from({ length: 14 }, (_, i) => ({
    x: seededVal(seed, i * 3)     * width,
    y: seededVal(seed, i * 3 + 1) * horizon * 0.7,
    r: seededVal(seed, i * 3 + 2) > 0.7 ? 1.2 : 0.6,
  }));

  // Deterministic rain streaks
  const rain = Array.from({ length: 10 }, (_, i) => ({
    x:  seededVal(seed, 100 + i * 2)       * width,
    y:  seededVal(seed, 100 + i * 2 + 1)   * horizon,
    len: 4 + seededVal(seed, 200 + i) * 6,
  }));

  // Moon position (deterministic, top-right area)
  const moonX = width * (0.75 + seededVal(seed, 300) * 0.15);
  const moonY = height * (0.05 + seededVal(seed, 301) * 0.08);

  // Perspective street lines converging toward center
  const vanishX = width / 2;
  const vanishY = horizon;

  return (
    <>
      <defs>
        <linearGradient id={`${uid}_skyGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#020208" />
          <stop offset="55%"  stopColor="#070718" />
          <stop offset="100%" stopColor="#0d0d2f" />
        </linearGradient>
        <linearGradient id={`${uid}_glowGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={districtColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={districtColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}_groundGrad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0a0a18" />
          <stop offset="100%" stopColor="#050510" />
        </linearGradient>
        {/* Film grain filter */}
        <filter id={`${uid}_grain`} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        {/* CRT scanlines pattern */}
        <pattern id={`${uid}_scanlines`} x="0" y="0" width={width} height="2" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width={width} height="1" fill="black" fillOpacity="0.08" />
          <rect x="0" y="1" width={width} height="1" fill="black" fillOpacity="0" />
        </pattern>
      </defs>

      {/* Sky */}
      <rect width={width} height={height} fill={`url(#${uid}_skyGrad)`} />

      {/* Stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" fillOpacity={0.4 + seededVal(seed, 400 + i) * 0.5} />
      ))}

      {/* Moon */}
      <circle cx={moonX} cy={moonY} r={5} fill="#d0d8f0" fillOpacity="0.6" />
      <circle cx={moonX + 2} cy={moonY - 1} r={4} fill="#0d0d2f" fillOpacity="0.75" />

      {/* Rain streaks */}
      {rain.map((r, i) => (
        <line
          key={i}
          x1={r.x}
          y1={r.y}
          x2={r.x + 1}
          y2={r.y + r.len}
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity={0.08 + seededVal(seed, 500 + i) * 0.1}
        />
      ))}

      {/* Horizon glow */}
      <rect x={0} y={horizon * 0.8} width={width} height={height * 0.2} fill={`url(#${uid}_glowGrad)`} />

      {/* Mid-ground buildings */}
      {midBuildings.map((b, i) => (
        <g key={`mg-${i}`}>
          <rect
            x={b.x}
            y={horizon - b.h}
            width={b.w}
            height={b.h}
            fill="#0c0c1e"
            stroke={districtColor}
            strokeWidth="0.75"
            strokeOpacity="0.5"
          />
          {/* Windows */}
          {Array.from({ length: Math.floor(b.h / 10) }).map((_, wi) => (
            <rect
              key={wi}
              x={b.x + 4}
              y={horizon - b.h + 6 + wi * 10}
              width={5}
              height={3}
              fill={districtColor}
              fillOpacity={seededVal(seed, i * 50 + wi) > 0.45 ? 0.75 : 0.07}
            />
          ))}
          {/* Neon sign block (on some buildings) */}
          {seededVal(seed, 600 + i) > 0.5 && (
            <rect
              x={b.x + 3}
              y={horizon - b.h - 6}
              width={b.w - 6}
              height={5}
              rx={1}
              fill={districtColor}
              fillOpacity="0.3"
              stroke={districtColor}
              strokeWidth="0.5"
            />
          )}
          {/* Rooftop antenna */}
          {b.h > 70 && (
            <>
              <line
                x1={b.x + b.w / 2}
                y1={horizon - b.h}
                x2={b.x + b.w / 2}
                y2={horizon - b.h - 10}
                stroke="#666"
                strokeWidth="0.75"
              />
              <circle cx={b.x + b.w / 2} cy={horizon - b.h - 11} r={1.5} fill="#ff2222" fillOpacity="0.9" />
            </>
          )}
        </g>
      ))}

      {/* Foreground buildings (darker silhouette layer) */}
      {fgBuildings.map((b, i) => (
        <g key={`fg-${i}`}>
          <rect
            x={b.x}
            y={horizon - b.h}
            width={b.w}
            height={b.h}
            fill="#0d0d1a"
            stroke={districtColor}
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />
          {/* Window lights */}
          {Array.from({ length: Math.floor(b.h / 12) }).map((_, wi) => (
            <rect
              key={wi}
              x={b.x + 4}
              y={horizon - b.h + 8 + wi * 12}
              width={4}
              height={3}
              fill={districtColor}
              fillOpacity={seededVal(seed, i * 80 + wi + 1000) > 0.4 ? 0.8 : 0.08}
            />
          ))}
          {/* Antenna on tall buildings */}
          {b.h >= 90 && (
            <>
              <line
                x1={b.x + b.w / 2}
                y1={horizon - b.h}
                x2={b.x + b.w / 2}
                y2={horizon - b.h - 8}
                stroke="#555"
                strokeWidth="0.6"
              />
              <circle cx={b.x + b.w / 2} cy={horizon - b.h - 9} r={1.2} fill="#ff3333" fillOpacity="0.85" />
            </>
          )}
        </g>
      ))}

      {/* Ground */}
      <rect x={0} y={horizon} width={width} height={height - horizon} fill={`url(#${uid}_groundGrad)`} />

      {/* Perspective street lines */}
      {[0.18, 0.38, 0.62, 0.82].map((t, i) => (
        <line
          key={i}
          x1={t * width}
          y1={height}
          x2={vanishX}
          y2={vanishY}
          stroke={districtColor}
          strokeWidth="0.5"
          strokeOpacity={0.15 + i * 0.05}
        />
      ))}
      {/* Horizontal street lines */}
      <line x1={0} y1={height * 0.72} x2={width} y2={height * 0.72} stroke={districtColor} strokeWidth="0.5" strokeOpacity="0.25" />
      <line x1={0} y1={height * 0.85} x2={width} y2={height * 0.85} stroke={districtColor} strokeWidth="0.4" strokeOpacity="0.15" />

      {/* Wet pavement reflections — mirror window dots */}
      {fgBuildings.slice(0, 4).map((b, i) =>
        Array.from({ length: Math.min(2, Math.floor(b.h / 12)) }).map((_, wi) => (
          seededVal(seed, i * 80 + wi + 1000) > 0.4 ? (
            <circle
              key={`ref-${i}-${wi}`}
              cx={b.x + 6}
              cy={horizon + (wi + 1) * 8}
              r={2}
              fill={districtColor}
              fillOpacity={0.12 - wi * 0.03}
            />
          ) : null
        ))
      )}

      {/* CRT scanlines overlay */}
      <rect width={width} height={height} fill={`url(#${uid}_scanlines)`} />

      {/* Film grain overlay */}
      <rect width={width} height={height} fill="transparent" filter={`url(#${uid}_grain)`} opacity="0.06" />
    </>
  );
}

interface FigureProps {
  cx: number;
  cy: number;
  accentColor: string;
  jacketStyle: string;
  boardStyle: string;
  helmetStyle: string;
  seed: string;
}

function CourierFigure({ cx, cy, accentColor, jacketStyle, boardStyle, helmetStyle, seed }: FigureProps) {
  const torsoColor  = JACKET_COLORS[jacketStyle]  || "#1e1e3a";
  const boardColor  = BOARD_COLORS[boardStyle]    || "#1a1a2e";
  const hasNeonStripe = boardStyle === "NeonCruiser";

  // Helmet style variants
  const hasDome    = helmetStyle === "DomeShell";
  const hasFullVisor = helmetStyle === "Visor-X" || helmetStyle === "HoloShade";

  return (
    <g>
      {/* Motion trail */}
      <ellipse cx={cx - 14} cy={cy + 20} rx={18} ry={8} fill={accentColor} fillOpacity="0.06" />
      <ellipse cx={cx - 22} cy={cy + 22} rx={10} ry={5} fill={accentColor} fillOpacity="0.04" />

      {/* Board trucks */}
      <rect x={cx - 22} y={cy + 33} width={6} height={3} rx={1} fill="#333" stroke={accentColor} strokeWidth="0.5" />
      <rect x={cx + 16} y={cy + 33} width={6} height={3} rx={1} fill="#333" stroke={accentColor} strokeWidth="0.5" />

      {/* Board */}
      <rect x={cx - 28} y={cy + 28} width={56} height={8} rx={4} fill={boardColor} stroke={accentColor} strokeWidth="1.5" />
      {/* Board grip tape texture */}
      {[0, 1, 2].map(i => (
        <line key={i}
          x1={cx - 20 + i * 12} y1={cy + 29}
          x2={cx - 20 + i * 12} y2={cy + 35}
          stroke={accentColor} strokeWidth="0.4" strokeOpacity="0.3"
        />
      ))}
      {/* NeonCruiser board stripe */}
      {hasNeonStripe && (
        <line x1={cx - 26} y1={cy + 32} x2={cx + 26} y2={cy + 32} stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.7" />
      )}

      {/* Wheels */}
      <circle cx={cx - 18} cy={cy + 40} r={6} fill="#111" stroke={accentColor} strokeWidth="1.5" />
      <circle cx={cx + 18} cy={cy + 40} r={6} fill="#111" stroke={accentColor} strokeWidth="1.5" />
      {/* Wheel spokes */}
      {[0, 1, 2].map(i => {
        const angle = (i / 3) * Math.PI;
        const dx = Math.cos(angle) * 4.5;
        const dy = Math.sin(angle) * 4.5;
        return (
          <g key={i}>
            <line x1={cx - 18 - dx} y1={cy + 40 - dy} x2={cx - 18 + dx} y2={cy + 40 + dy} stroke={accentColor} strokeWidth="0.6" strokeOpacity="0.5" />
            <line x1={cx + 18 - dx} y1={cy + 40 - dy} x2={cx + 18 + dx} y2={cy + 40 + dy} stroke={accentColor} strokeWidth="0.6" strokeOpacity="0.5" />
          </g>
        );
      })}
      {/* Wheel glow cores */}
      <circle cx={cx - 18} cy={cy + 40} r={3} fill={accentColor} fillOpacity="0.7" />
      <circle cx={cx + 18} cy={cy + 40} r={3} fill={accentColor} fillOpacity="0.7" />

      {/* Legs */}
      <rect x={cx - 10} y={cy + 18} width={8} height={14} rx={2} fill="#14142a" />
      <rect x={cx + 2}  y={cy + 18} width={8} height={14} rx={2} fill="#14142a" />
      {/* Knee pads */}
      <rect x={cx - 11} y={cy + 23} width={9}  height={5} rx={2} fill="#252540" stroke={accentColor} strokeWidth="0.6" />
      <rect x={cx + 2}  y={cy + 23} width={9}  height={5} rx={2} fill="#252540" stroke={accentColor} strokeWidth="0.6" />

      {/* Body / torso */}
      <rect x={cx - 12} y={cy - 10} width={24} height={30} rx={4} fill={torsoColor} stroke={accentColor} strokeWidth="1" />
      {/* Jacket stripe */}
      <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 20} stroke={accentColor} strokeWidth="2" strokeOpacity="0.7" />
      {/* Chest badge */}
      <rect x={cx - 5} y={cy - 6} width={10} height={7} rx={1} fill={accentColor} fillOpacity="0.25" stroke={accentColor} strokeWidth="0.5" />
      <circle cx={cx} cy={cy - 2} r={1.5} fill={accentColor} fillOpacity="0.8" />

      {/* Shoulder pads */}
      <rect x={cx - 16} y={cy - 10} width={8}  height={6} rx={2} fill={torsoColor} stroke={accentColor} strokeWidth="0.8" />
      <rect x={cx + 8}  y={cy - 10} width={8}  height={6} rx={2} fill={torsoColor} stroke={accentColor} strokeWidth="0.8" />

      {/* Arm extended */}
      <rect x={cx + 10} y={cy - 5} width={14} height={6} rx={3} fill={torsoColor} stroke={accentColor} strokeWidth="1"
        transform={`rotate(-20,${cx + 10},${cy - 2})`} />
      {/* Hand / fist */}
      <circle cx={cx + 25} cy={cy - 9} r={4} fill={torsoColor} stroke={accentColor} strokeWidth="1"
        transform={`rotate(-20,${cx + 10},${cy - 2})`} />

      {/* Head */}
      <circle cx={cx} cy={cy - 18} r={11} fill="#1e1e3a" stroke={accentColor} strokeWidth="1.5" />

      {/* Helmet variants */}
      {hasDome && (
        <path d={`M${cx - 10},${cy - 18} A10,10 0 0,1 ${cx + 10},${cy - 18}`}
          fill={accentColor} fillOpacity="0.15" stroke={accentColor} strokeWidth="0.8" />
      )}
      {hasFullVisor ? (
        <>
          <rect x={cx - 9} y={cy - 24} width={18} height={8} rx={3} fill={accentColor} fillOpacity="0.35" stroke={accentColor} strokeWidth="0.8" />
          <rect x={cx - 7} y={cy - 23} width={14} height={5} rx={2} fill={accentColor} fillOpacity="0.2" />
        </>
      ) : (
        <>
          <path d={`M${cx - 8},${cy - 22} Q${cx},${cy - 28} ${cx + 8},${cy - 22}`} fill={accentColor} fillOpacity="0.5" />
          <rect x={cx - 8} y={cy - 22} width={16} height={5} rx={2} fill={accentColor} fillOpacity="0.6" />
        </>
      )}

      {/* Glow under board */}
      <ellipse cx={cx} cy={cy + 43} rx={22} ry={4} fill={accentColor} fillOpacity="0.25" />
      {/* Data trail from wheels */}
      <ellipse cx={cx - 18} cy={cy + 46} rx={4} ry={1.5} fill={accentColor} fillOpacity="0.15" />
      <ellipse cx={cx + 18} cy={cy + 46} rx={4} ry={1.5} fill={accentColor} fillOpacity="0.15" />

      {/* Faint body ambient glow */}
      <ellipse cx={cx} cy={cy + 10} rx={14} ry={20} fill={accentColor} fillOpacity="0.04" />
    </g>
  );
}

interface RarityFrameProps {
  width: number;
  height: number;
  rarity: string;
  uid: string;
}

function RarityFrame({ width, height, rarity, uid }: RarityFrameProps) {
  if (rarity === "Legendary") {
    return (
      <>
        <defs>
          <filter id={`${uid}_goldGlow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x={2} y={2} width={width - 4} height={height - 4} rx={4}
          fill="none" stroke="#ffaa00" strokeWidth="1.5" strokeOpacity="0.6"
          filter={`url(#${uid}_goldGlow)`} />
        <rect x={4} y={4} width={width - 8} height={height - 8} rx={3}
          fill="none" stroke="#ffaa00" strokeWidth="0.5" strokeOpacity="0.35" />
      </>
    );
  }
  if (rarity === "Rare") {
    return (
      <>
        <defs>
          <filter id={`${uid}_blueGlow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x={2} y={2} width={width - 4} height={height - 4} rx={4}
          fill="none" stroke="#4488ff" strokeWidth="1" strokeOpacity="0.5"
          filter={`url(#${uid}_blueGlow)`} />
      </>
    );
  }
  return null;
}

export function CardArt({ card, width = 200, height = 140 }: CardArtProps) {
  const accent        = card.visuals.accentColor || "#00ff88";
  const districtColor = DISTRICT_COLORS[card.prompts.district] || accent;
  const stars         = RARITY_STARS[card.prompts.rarity] || 1;
  const isLegendary   = card.prompts.rarity === "Legendary";
  const starColor     = isLegendary ? "#ffaa00" : accent;

  // Stable UID from card id (strip non-alphanumeric, cap length)
  const uid = card.id.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "ca";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
      aria-label={`Card art for ${card.identity.name}`}
    >
      <CityscapeBackground
        width={width}
        height={height}
        districtColor={districtColor}
        seed={card.seed}
        uid={uid}
      />
      <CourierFigure
        cx={width / 2}
        cy={height * 0.55}
        accentColor={accent}
        jacketStyle={card.visuals.jacketStyle}
        boardStyle={card.visuals.boardStyle}
        helmetStyle={card.visuals.helmetStyle}
        seed={card.seed}
      />
      <RarityFrame width={width} height={height} rarity={card.prompts.rarity} uid={uid} />
      {/* Rarity stars */}
      {Array.from({ length: stars }).map((_, i) => (
        <polygon
          key={i}
          points="0,-5 1.5,-1.5 5,-1.5 2.5,1 3.5,5 0,2.5 -3.5,5 -2.5,1 -5,-1.5 -1.5,-1.5"
          fill={starColor}
          fillOpacity={isLegendary ? 1 : 0.9}
          transform={`translate(${width / 2 - (stars - 1) * 7 + i * 14}, 12)`}
        />
      ))}
      {/* District label */}
      <text
        x={width - 4}
        y={height - 4}
        textAnchor="end"
        fontSize="6"
        fill={districtColor}
        fontFamily="monospace"
        fillOpacity="0.8"
      >
        {card.prompts.district}
      </text>
      {/* Archetype badge */}
      <rect x={2} y={2} width={40} height={12} rx={3} fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="0.5" />
      <text x={22} y={11} textAnchor="middle" fontSize="7" fill={accent} fontFamily="monospace">
        {card.prompts.archetype.toUpperCase()}
      </text>
    </svg>
  );
}
