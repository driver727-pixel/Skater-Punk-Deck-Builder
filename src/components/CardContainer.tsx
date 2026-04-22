import type { CSSProperties, ReactNode } from "react";

interface CardContainerProps {
  cardVars: CSSProperties;
  children: ReactNode;
}

/**
 * Thin wrapper that applies a CSS-variable style object so all descendant
 * card-face elements (Card Editor, 3D viewer, Print preview) share the same
 * design tokens for sizing and accent colour without prop drilling.
 *
 * Usage:
 *   <CardContainer cardVars={buildCardVars(card, "editor")}>
 *     <PrintedCardPreviewPair ... />
 *   </CardContainer>
 */
export function CardContainer({ cardVars, children }: CardContainerProps) {
  return <div style={cardVars}>{children}</div>;
}
