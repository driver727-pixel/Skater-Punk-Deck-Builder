/**
 * PrintedCardFaces — backward-compatible wrappers around SkaterCardFace.
 *
 * New code should import SkaterCardFace directly.  These exports are kept so
 * existing consumers (PrintModal, CardViewer3D) compile without changes until
 * they are migrated.
 */

import { SkaterCardFace, type SkaterCardFaceProps } from "./SkaterCardFace";

// Re-export the shared prop interface so existing imports are unchanged.
export type { SkaterCardFaceProps as PrintedCardFaceProps };

/** @deprecated Use <SkaterCardFace face="front" ... /> instead. */
export function PrintedCardFrontContent(props: Omit<SkaterCardFaceProps, "face">) {
  return <SkaterCardFace face="front" {...props} />;
}

/** @deprecated Use <SkaterCardFace face="back" ... /> instead. */
export function PrintedCardBackContent(props: Omit<SkaterCardFaceProps, "face">) {
  return <SkaterCardFace face="back" {...props} />;
}

interface PrintedCardPreviewPairProps extends Omit<SkaterCardFaceProps, "face"> {
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
            <SkaterCardFace
              face="front"
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
            <SkaterCardFace
              face="back"
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

