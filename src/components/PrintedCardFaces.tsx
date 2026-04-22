import type { CardPayload } from "../lib/types";
import { CardArt } from "./CardArt";
import { FrameOverlay } from "./FrameOverlay";
import { StatBar } from "./StatBar";
import { getDisplayedArchetype, getDisplayedCrew } from "../lib/cardIdentity";
import { CARD_STAT_LABELS } from "../lib/statLabels";
import { getFrameBlendMode, shouldInsetBackgroundForFrame, shouldRenderSvgFrame } from "../services/staticAssets";

export interface PrintedCardFaceProps {
  card: CardPayload;
  backgroundImageUrl?: string;
  characterImageUrl?: string;
  frameImageUrl?: string;
  characterBlend?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
  /** When true, text fields are replaced with interactive inputs. */
  editable?: boolean;
  onNameChange?: (value: string) => void;
  onBioChange?: (value: string) => void;
  onAgeChange?: (value: string) => void;
  onStatChange?: (key: keyof CardPayload["stats"], value: number) => void;
}

const PRINT_RARITY_COLORS: Record<string, string> = {
  "Punch Skater": "#aa9988",
  Apprentice: "#44ddaa",
  Master: "#cc44ff",
  Rare: "#4488ff",
  Legendary: "#ffaa00",
};

export function PrintedCardFrontContent({
  card,
  backgroundImageUrl,
  characterImageUrl,
  frameImageUrl,
  characterBlend,
  fallbackWidth = 189,
  fallbackHeight = 264,
  editable = false,
  onNameChange,
  onBioChange,
  onAgeChange,
}: PrintedCardFaceProps) {
  const hasAnyLayer = backgroundImageUrl || characterImageUrl || frameImageUrl;
  const backgroundLayerClassName = shouldInsetBackgroundForFrame(card.prompts.rarity, frameImageUrl)
    ? "print-art-layer print-art-layer--bg print-art-layer--bg-inset"
    : "print-art-layer print-art-layer--bg";
  const showSvgFrame = shouldRenderSvgFrame(card.prompts.rarity, frameImageUrl);
  const frameLayerStyle = frameImageUrl
    ? { mixBlendMode: getFrameBlendMode(card.prompts.rarity, frameImageUrl) }
    : undefined;

  return (
    <>
      {hasAnyLayer ? (
        <div className="print-art-composite">
          {backgroundImageUrl && (
            <img src={backgroundImageUrl} alt="background" className={backgroundLayerClassName} />
          )}
          {characterImageUrl && (
            <img
              src={characterImageUrl}
              alt="character"
              className="print-art-layer print-art-layer--char"
              style={characterBlend !== undefined ? { opacity: characterBlend } : undefined}
            />
          )}
          {frameImageUrl && !showSvgFrame && (
            <img src={frameImageUrl} alt="frame" className="print-art-layer print-art-layer--frame" style={frameLayerStyle} />
          )}
          {showSvgFrame && (
            <FrameOverlay
              rarity={card.prompts.rarity}
              frameSeed={card.frameSeed}
              className="print-art-layer print-art-layer--svg-frame"
            />
          )}
        </div>
      ) : (
        <CardArt card={card} width={fallbackWidth} height={fallbackHeight} />
      )}
      <div className="print-front-overlay">
        {editable ? (
          <>
            <input
              className="card-name-input"
              value={card.identity.name}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Name"
            />
            <input
              className="card-age-input"
              value={card.identity.age ?? ""}
              onChange={(e) => onAgeChange?.(e.target.value)}
              placeholder="Age"
            />
            <textarea
              className="card-bio-input"
              value={card.flavorText}
              onChange={(e) => onBioChange?.(e.target.value)}
              placeholder="Bio / flavor text"
              rows={2}
            />
          </>
        ) : (
          <>
            <span className="print-front-name">{card.identity.name}</span>
            {card.identity.age && (
              <span className="print-front-age">{card.identity.age}</span>
            )}
            <p className="print-front-bio">&ldquo;{card.flavorText}&rdquo;</p>
          </>
        )}
      </div>
    </>
  );
}

export function PrintedCardBackContent({ card, editable = false, onStatChange }: PrintedCardFaceProps) {
  const accent = card.visuals.accentColor || "#00ff88";
  const rarityColor = PRINT_RARITY_COLORS[card.prompts.rarity] || "#aaaaaa";

  return (
    <>
      <div className="print-back-header" style={{ background: rarityColor }}>
        <span className="print-back-name">{card.identity.name}</span>
        <span className="print-back-rarity">{card.prompts.rarity.toUpperCase()}</span>
      </div>

      {card.board && (
        <div className="print-back-board">
          {card.boardImageUrl ? (
            <img src={card.boardImageUrl} alt="Electric skateboard" className="print-back-board-image" />
          ) : (
            <div className="print-back-board-placeholder">🛹</div>
          )}
        </div>
      )}

      <div className="print-back-stats">
        {editable ? (
          (Object.entries(CARD_STAT_LABELS) as [keyof CardPayload["stats"], { label: string; tooltip: string }][]).map(
            ([key, { label, tooltip }]) => (
              <div key={key} className="stat-bar card-stat-editor-row">
                <span className="stat-label" title={tooltip}>{label}</span>
                <input
                  type="number"
                  className="card-stat-input"
                  min={0}
                  max={10}
                  value={card.stats[key]}
                  onChange={(e) => onStatChange?.(key, Number(e.target.value))}
                  onBlur={(e) =>
                    onStatChange?.(key, Math.max(0, Math.min(10, Number(e.target.value))))
                  }
                />
              </div>
            ),
          )
        ) : (
          <>
            <StatBar label={CARD_STAT_LABELS.speed.label}   value={card.stats.speed}   color={accent} tooltip={CARD_STAT_LABELS.speed.tooltip} />
            <StatBar label={CARD_STAT_LABELS.stealth.label} value={card.stats.stealth} color={accent} tooltip={CARD_STAT_LABELS.stealth.tooltip} />
            <StatBar label={CARD_STAT_LABELS.tech.label}    value={card.stats.tech}    color={accent} tooltip={CARD_STAT_LABELS.tech.tooltip} />
            <StatBar label={CARD_STAT_LABELS.grit.label}    value={card.stats.grit}    color={accent} tooltip={CARD_STAT_LABELS.grit.tooltip} />
            <StatBar label={CARD_STAT_LABELS.rep.label}     value={card.stats.rep}     color={accent} tooltip={CARD_STAT_LABELS.rep.tooltip} />
          </>
        )}
      </div>

      <div className="print-back-info">
        {[
          ["ARCHETYPE", getDisplayedArchetype(card)],
          ["STYLE", card.prompts.style],
          ["DISTRICT", card.prompts.district],
          ["CREW", getDisplayedCrew(card)],
        ].map(([label, value]) => (
          <div key={label} className="print-back-row">
            <span className="print-back-row-label">{label}</span>
            <span className="print-back-row-value">{value}</span>
          </div>
        ))}
      </div>

      <div className="print-back-trait">
        <span className="print-back-trait-label">
          PASSIVE · {card.traits.passiveTrait.name}
        </span>
        <p className="print-back-trait-desc">{card.traits.passiveTrait.description}</p>
      </div>

      <div className="print-back-trait">
        <span className="print-back-trait-label">
          ACTIVE · {card.traits.activeAbility.name}
        </span>
        <p className="print-back-trait-desc">{card.traits.activeAbility.description}</p>
      </div>

      <div className="print-back-tags">
        {card.traits.personalityTags.map((tag) => (
          <span key={tag} className="print-back-tag" style={{ borderColor: accent }}>{tag}</span>
        ))}
      </div>

      <div className="print-back-serial">{card.identity.serialNumber}</div>
    </>
  );
}

interface PrintedCardPreviewPairProps extends PrintedCardFaceProps {
  className?: string;
}

export function PrintedCardPreviewPair({
  card,
  backgroundImageUrl,
  characterImageUrl,
  frameImageUrl,
  characterBlend,
  className,
  editable,
  onNameChange,
  onBioChange,
  onAgeChange,
  onStatChange,
}: PrintedCardPreviewPairProps) {
  const previewClassName = className ? `print-preview-area ${className}` : "print-preview-area";

  return (
    <div className={previewClassName}>
      <div className="print-preview-slot">
        <p className="print-preview-label">Front</p>
        <div className="print-card-wrap">
          <div className="print-card print-card--front">
            <PrintedCardFrontContent
              card={card}
              backgroundImageUrl={backgroundImageUrl}
              characterImageUrl={characterImageUrl}
              frameImageUrl={frameImageUrl}
              characterBlend={characterBlend}
              editable={editable}
              onNameChange={onNameChange}
              onBioChange={onBioChange}
              onAgeChange={onAgeChange}
            />
          </div>
        </div>
      </div>

      <div className="print-preview-slot">
        <p className="print-preview-label">Back</p>
        <div className="print-card-wrap">
          <div className="print-card print-card--back">
            <PrintedCardBackContent
              card={card}
              editable={editable}
              onStatChange={onStatChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
