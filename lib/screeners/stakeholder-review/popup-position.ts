export type FloatingPanelPlacement = "above" | "below";

export type FloatingPanelPosition = {
  top: number;
  left: number;
  maxHeight: number;
  placement: FloatingPanelPlacement;
};

const VIEWPORT_PAD = 12;

/**
 * Chooses above/below placement and max height so the panel stays in the viewport
 * and can scroll internally when content is long.
 */
export function computeFloatingPanelPosition(options: {
  anchorRect: DOMRect;
  panelWidth: number;
  gap?: number;
}): FloatingPanelPosition {
  const gap = options.gap ?? 8;
  const panelWidth = options.panelWidth;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceBelow = vh - VIEWPORT_PAD - (options.anchorRect.bottom + gap);
  const spaceAbove = options.anchorRect.top - gap - VIEWPORT_PAD;
  const preferBelow = spaceBelow >= 200 || spaceBelow >= spaceAbove;
  const placement: FloatingPanelPlacement = preferBelow ? "below" : "above";

  const maxHeight = Math.max(
    160,
    Math.min(
      Math.floor(vh * 0.72),
      preferBelow ? spaceBelow : spaceAbove,
    ),
  );

  let top: number;
  if (placement === "below") {
    top = options.anchorRect.bottom + gap;
  } else {
    top = Math.max(
      VIEWPORT_PAD,
      options.anchorRect.top - gap - maxHeight,
    );
  }

  const idealLeft =
    options.anchorRect.left +
    options.anchorRect.width / 2 -
    panelWidth / 2;
  const left = Math.min(
    Math.max(VIEWPORT_PAD, idealLeft),
    vw - panelWidth - VIEWPORT_PAD,
  );

  return { top, left, maxHeight, placement };
}
