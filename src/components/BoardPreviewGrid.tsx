/**
 * BoardPreviewGrid.tsx
 *
 * Renders the selected board components inside a composition grid.
 * The Deck anchors the left side of the canvas while the remaining
 * components fill the surrounding top, right, and bottom positions.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import type { BoardComponentImageUrls } from "../lib/boardBuilder";

interface BoardPreviewGridProps {
  urls: BoardComponentImageUrls;
  /** Labels shown on placeholder tiles when an image is missing. */
  labels?: { deck?: string; drivetrain?: string; motor?: string; wheels?: string; battery?: string };
  /** Extra CSS class applied to the outer container. */
  className?: string;
  /** Solid accent background shown behind transparent board component PNGs. */
  accentColor?: string;
}

interface LayerProps {
  src: string;
  alt: string;
  icon: string;
  slot: string;
  label: string;
  tileClassName: string;
}

function Layer({ src, alt, icon, slot, label, tileClassName }: LayerProps) {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => setFailed(true), []);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className={`board-preview-grid__tile ${tileClassName}`}>
      {failed ? (
        <div className="board-preview-grid__placeholder">
          <span className="board-preview-grid__placeholder-icon">{icon}</span>
          <span className="board-preview-grid__placeholder-label">{slot}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="board-preview-grid__image"
          onError={handleError}
        />
      )}
      <span className="board-preview-grid__tile-label" aria-label={`${slot}: ${label}`}>
        <span className="board-preview-grid__tile-label-slot">{slot}</span>
        <span className="board-preview-grid__tile-label-value">{label}</span>
      </span>
    </div>
  );
}

export function BoardPreviewGrid({ urls, labels, className, accentColor = "#00ff88" }: BoardPreviewGridProps) {
  const layers = useMemo(() => ([
    {
      key: "wheels",
      src: urls.wheelsUrl,
      alt: labels?.wheels ?? "Wheels",
      label: labels?.wheels ?? "Wheels",
      icon: "🛞",
      slot: "Wheels",
      tileClassName: "board-preview-grid__tile--wheels",
    },
    {
      key: "deck",
      src: urls.deckUrl,
      alt: labels?.deck ?? "Deck",
      label: labels?.deck ?? "Deck",
      icon: "🛹",
      slot: "Deck",
      tileClassName: "board-preview-grid__tile--deck",
    },
    {
      key: "battery",
      src: urls.batteryUrl,
      alt: labels?.battery ?? "Battery",
      label: labels?.battery ?? "Battery",
      icon: "🔋",
      slot: "Battery",
      tileClassName: "board-preview-grid__tile--battery",
    },
    {
      key: "drivetrain",
      src: urls.drivetrainUrl,
      alt: labels?.drivetrain ?? "Drivetrain",
      label: labels?.drivetrain ?? "Drivetrain",
      icon: "⚙️",
      slot: "Drivetrain",
      tileClassName: "board-preview-grid__tile--drivetrain",
    },
    {
      key: "motor",
      src: urls.motorUrl,
      alt: labels?.motor ?? "Motor",
      label: labels?.motor ?? "Motor",
      icon: "⚡",
      slot: "Motor",
      tileClassName: "board-preview-grid__tile--motor",
    },
  ]), [labels, urls]);

  return (
    <div
      className={`board-preview-grid${className ? ` ${className}` : ""}`}
      style={{ "--board-preview-accent-bg": accentColor } as CSSProperties}
    >
      <div className="board-preview-grid__canvas" aria-label="Board assembly canvas">
        <div className="board-preview-grid__canvas-glow" aria-hidden="true" />
        {layers.map((layer) => (
          <Layer
            key={layer.key}
            src={layer.src}
            alt={layer.alt}
            icon={layer.icon}
            slot={layer.slot}
            label={layer.label}
            tileClassName={layer.tileClassName}
          />
        ))}
      </div>
      <div className="board-preview-grid__legend" aria-label="Selected board parts">
        {layers.map((layer) => (
          <div key={`${layer.key}-legend`} className="board-preview-grid__legend-copy">
            <span className="board-preview-grid__slot">{layer.slot}</span>
            <span className="board-preview-grid__value">{layer.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
