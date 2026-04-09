/**
 * BoardComposite.tsx
 *
 * Visually stacks three pre-generated skateboard component PNGs into a single
 * composite image. Layers are ordered from bottom to top:
 *
 *   Wheels (z-index: 10) → Drivetrain / Trucks (z-index: 20) → Deck (z-index: 30)
 *
 * This ordering ensures trucks and wheels appear mounted underneath the board
 * regardless of the angle of the individual PNGs.  `object-fit: contain` keeps
 * each image un-distorted regardless of the component's native dimensions.
 *
 * All URLs are optional — missing layers are simply not rendered.  The
 * component returns null when none of the three URLs are provided.
 */

interface BoardCompositeProps {
  /** URL of the deck layer PNG (top layer, z-index 30). */
  deckUrl?: string | null;
  /** URL of the drivetrain / trucks layer PNG (middle layer, z-index 20). */
  drivetrainUrl?: string | null;
  /** URL of the wheels layer PNG (bottom layer, z-index 10). */
  wheelsUrl?: string | null;
  /** Extra CSS class applied to the outer container. */
  className?: string;
}

export function BoardComposite({
  deckUrl,
  drivetrainUrl,
  wheelsUrl,
  className,
}: BoardCompositeProps) {
  if (!deckUrl && !drivetrainUrl && !wheelsUrl) return null;

  return (
    <div className={`board-composite${className ? ` ${className}` : ""}`}>
      {/* Bottom layer — wheels */}
      {wheelsUrl && (
        <img
          src={wheelsUrl}
          alt="wheels"
          className="board-composite__layer board-composite__layer--wheels"
        />
      )}

      {/* Middle layer — drivetrain / trucks */}
      {drivetrainUrl && (
        <img
          src={drivetrainUrl}
          alt="drivetrain"
          className="board-composite__layer board-composite__layer--drivetrain"
        />
      )}

      {/* Top layer — deck */}
      {deckUrl && (
        <img
          src={deckUrl}
          alt="deck"
          className="board-composite__layer board-composite__layer--deck"
        />
      )}
    </div>
  );
}
