import { useEffect, useRef, useState, useCallback } from "react";
import type { CardPayload } from "../lib/types";
import { CardArt } from "./CardArt";
import { FrameOverlay } from "./FrameOverlay";
import { StatBar } from "./StatBar";
import { getDisplayedArchetype, getDisplayedCrew } from "../lib/cardIdentity";
import { CARD_STAT_LABELS } from "../lib/statLabels";
import { getFrameBlendMode, shouldInsetBackgroundForFrame, shouldRenderSvgFrame } from "../services/staticAssets";
import {
  BATTERY_OPTIONS,
  BOARD_TYPE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  MOTOR_OPTIONS,
  WHEEL_OPTIONS,
  calculateBoardStats,
  normalizeBoardConfig,
} from "../lib/boardBuilder";
import { SkateboardStatsPanel } from "./SkateboardStatsPanel";

interface CardViewer3DProps {
  card: CardPayload;
  backgroundImageUrl?: string;
  characterImageUrl?: string;
  frameImageUrl?: string;
  characterBlend?: number;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  "Punch Skater": "#aa9988",
  Apprentice:     "#44ddaa",
  Master:         "#cc44ff",
  Rare:           "#4488ff",
  Legendary:      "#ffaa00",
};

export function CardViewer3D({
  card,
  backgroundImageUrl,
  characterImageUrl,
  frameImageUrl,
  characterBlend,
  onClose,
}: CardViewer3DProps) {
  const [rotateX, setRotateX] = useState(-5);
  const [rotateY, setRotateY] = useState(15);
  const [autoSpin, setAutoSpin] = useState(false);

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const spinRef = useRef<number | null>(null);

  const accent = card.visuals.accentColor || "#00ff88";
  const rarityColor = RARITY_COLORS[card.prompts.rarity] || "#aaaaaa";
  const board = card.board ? normalizeBoardConfig(card.board) : null;
  const boardLoadout = board ? calculateBoardStats(board) : card.boardLoadout;
  const boardRows = board ? [
    {
      label: "TYPE",
      icon: BOARD_TYPE_OPTIONS.find((option) => option.value === board.boardType)?.icon ?? "🛹",
      value: board.boardType,
    },
    {
      label: "DRIVE",
      icon: DRIVETRAIN_OPTIONS.find((option) => option.value === board.drivetrain)?.icon ?? "⚙️",
      value: DRIVETRAIN_OPTIONS.find((option) => option.value === board.drivetrain)?.label ?? board.drivetrain,
    },
    {
      label: "MOTOR",
      icon: MOTOR_OPTIONS.find((option) => option.value === board.motor)?.icon ?? "⚡",
      value: MOTOR_OPTIONS.find((option) => option.value === board.motor)?.label ?? board.motor,
    },
    {
      label: "WHEELS",
      icon: WHEEL_OPTIONS.find((option) => option.value === board.wheels)?.icon ?? "⚫",
      value: board.wheels,
    },
    {
      label: "BATTERY",
      icon: BATTERY_OPTIONS.find((option) => option.value === board.battery)?.icon ?? "🔋",
      value: BATTERY_OPTIONS.find((option) => option.value === board.battery)?.label ?? board.battery,
    },
  ].filter((row): row is { label: string; icon: string; value: string } => Boolean(row.value)) : [];

  const hasAnyLayer = backgroundImageUrl || characterImageUrl || frameImageUrl;
  const backgroundLayerClassName = shouldInsetBackgroundForFrame(card.prompts.rarity, frameImageUrl)
    ? "viewer3d-layer viewer3d-layer--bg viewer3d-layer--bg-inset"
    : "viewer3d-layer viewer3d-layer--bg";
  const showSvgFrame = shouldRenderSvgFrame(card.prompts.rarity, frameImageUrl);
  const frameLayerStyle = frameImageUrl
    ? { mixBlendMode: getFrameBlendMode(card.prompts.rarity, frameImageUrl) }
    : undefined;

  // ── Close on Escape ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Auto-spin ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoSpin) {
      const tick = () => {
        setRotateY((y) => y + 0.6);
        spinRef.current = requestAnimationFrame(tick);
      };
      spinRef.current = requestAnimationFrame(tick);
    } else {
      if (spinRef.current !== null) cancelAnimationFrame(spinRef.current);
    }
    return () => { if (spinRef.current !== null) cancelAnimationFrame(spinRef.current); };
  }, [autoSpin]);

  // ── Mouse drag ───────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (autoSpin) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [autoSpin]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRotateY((y) => y + dx * 0.5);
    setRotateX((x) => Math.max(-45, Math.min(45, x - dy * 0.5)));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // ── Touch drag ───────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (autoSpin) return;
    dragging.current = true;
    const t = e.touches[0];
    lastPos.current = { x: t.clientX, y: t.clientY };
  }, [autoSpin]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastPos.current.x;
    const dy = t.clientY - lastPos.current.y;
    lastPos.current = { x: t.clientX, y: t.clientY };
    setRotateY((y) => y + dx * 0.5);
    setRotateX((x) => Math.max(-45, Math.min(45, x - dy * 0.5)));
  }, []);

  // ── Flip ─────────────────────────────────────────────────────────────────────
  const handleFlip = () => {
    setAutoSpin(false);
    setRotateY((y) => y + 180);
  };

  const handleAutoSpin = () => {
    setAutoSpin((v) => !v);
  };

  const cardTransform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  return (
    <div
      className="viewer3d-overlay"
      onClick={onClose}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div className="viewer3d-scene" onClick={(e) => e.stopPropagation()}>
        {/* Card 3D object */}
        <div
          className="viewer3d-card"
          style={{ transform: cardTransform }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          {/* ── Front face ── */}
          <div className="viewer3d-face viewer3d-face--front">
            <div className="viewer3d-front-header">
              <span className="viewer3d-front-serial">{card.identity.serialNumber}</span>
              <span className="viewer3d-front-rarity" style={{ color: rarityColor }}>{card.prompts.rarity.toUpperCase()}</span>
            </div>

            <div className="viewer3d-front-art">
              {hasAnyLayer ? (
                <div className="viewer3d-art-composite">
                  {backgroundImageUrl && (
                    <img src={backgroundImageUrl} alt="background" className={backgroundLayerClassName} />
                  )}
                  {characterImageUrl && (
                    <img
                      src={characterImageUrl}
                      alt="character"
                      className="viewer3d-layer viewer3d-layer--char"
                      style={characterBlend !== undefined ? { opacity: characterBlend } : undefined}
                    />
                  )}
                  {frameImageUrl && !showSvgFrame && (
                    <img src={frameImageUrl} alt="frame" className="viewer3d-layer viewer3d-layer--frame" style={frameLayerStyle} />
                  )}
                  {showSvgFrame && (
                    <FrameOverlay
                      rarity={card.prompts.rarity}
                      frameSeed={card.frameSeed}
                      className="viewer3d-layer viewer3d-layer--svg-frame"
                    />
                  )}
                </div>
              ) : (
                <div className="viewer3d-art-svg">
                  <CardArt card={card} width={252} height={352} />
                </div>
              )}
              <div className="viewer3d-gloss" />
            </div>

            <div className="viewer3d-front-copy">
              <div className="viewer3d-front-identity">
                <h2 className="viewer3d-front-name">{card.identity.name}</h2>
                {card.identity.age && <p className="viewer3d-front-age">{card.identity.age}</p>}
              </div>

              <p className="viewer3d-front-bio">{card.flavorText}</p>

              {card.conlang?.catchphrase && (
                <p className="viewer3d-front-catchphrase">&ldquo;{card.conlang.catchphrase}&rdquo;</p>
              )}

              <div className="viewer3d-front-meta">
                <span>{getDisplayedArchetype(card)}</span>
                <span className="viewer3d-front-meta-sep">·</span>
                <span>{card.prompts.style}</span>
              </div>
              <div className="viewer3d-front-meta">
                <span>{card.prompts.district}</span>
                <span className="viewer3d-front-meta-sep">·</span>
                <span>{getDisplayedCrew(card)}</span>
              </div>
            </div>
          </div>

          {/* ── Back face ── */}
          <div
            className="viewer3d-face viewer3d-face--back"
            style={{ "--accent": accent } as React.CSSProperties}
          >
            <div className="viewer3d-back-header" style={{ background: rarityColor }}>
              <span className="viewer3d-back-name">{card.identity.name}</span>
              <span className="viewer3d-back-rarity">{card.prompts.rarity}</span>
            </div>

            <div className="viewer3d-back-body">
              <div className="viewer3d-back-board">
                <span className="viewer3d-back-section-label">BOARD</span>
                {card.boardImageUrl ? (
                  <img src={card.boardImageUrl} alt="Electric skateboard" className="viewer3d-back-board-image" />
                ) : (
                  <div className="viewer3d-back-board-placeholder">🛹</div>
                )}
              </div>

              {boardRows.length > 0 && (
                <div className="viewer3d-back-loadout">
                  {boardRows.map((row) => (
                    <div key={row.label} className="viewer3d-back-loadout-item">
                      <span className="viewer3d-back-loadout-icon">{row.icon}</span>
                      <span className="viewer3d-back-loadout-key">{row.label}</span>
                      <span className="viewer3d-back-loadout-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {boardLoadout && (
                <div className="viewer3d-back-board-stats">
                  <SkateboardStatsPanel loadout={boardLoadout} />
                </div>
              )}

              <div className="viewer3d-back-player-stats">
                <span className="viewer3d-back-section-label">SKATER STATS</span>
                <div className="viewer3d-back-stats">
                  <StatBar label={CARD_STAT_LABELS.speed.label}   value={card.stats.speed}   color={accent} tooltip={CARD_STAT_LABELS.speed.tooltip} />
                  <StatBar label={CARD_STAT_LABELS.stealth.label} value={card.stats.stealth} color={accent} tooltip={CARD_STAT_LABELS.stealth.tooltip} />
                  <StatBar label={CARD_STAT_LABELS.tech.label}    value={card.stats.tech}    color={accent} tooltip={CARD_STAT_LABELS.tech.tooltip} />
                  <StatBar label={CARD_STAT_LABELS.grit.label}    value={card.stats.grit}    color={accent} tooltip={CARD_STAT_LABELS.grit.tooltip} />
                  <StatBar label={CARD_STAT_LABELS.rep.label}     value={card.stats.rep}     color={accent} tooltip={CARD_STAT_LABELS.rep.tooltip} />
                </div>
              </div>

              <div className="viewer3d-back-serial">{card.identity.serialNumber}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="viewer3d-controls">
          <button className="viewer3d-btn" onClick={handleFlip} title="Flip card">
            ⟲ Flip
          </button>
          <button
            className={`viewer3d-btn${autoSpin ? " viewer3d-btn--active" : ""}`}
            onClick={handleAutoSpin}
            title="Toggle auto-spin"
          >
            ◎ Spin
          </button>
          <button className="viewer3d-btn" onClick={onClose} title="Close 3D viewer">
            ✕ Close
          </button>
        </div>

        <p className="viewer3d-hint">{autoSpin ? "Click Spin to stop" : "Drag to rotate · Flip to see card back"}</p>
      </div>
    </div>
  );
}
