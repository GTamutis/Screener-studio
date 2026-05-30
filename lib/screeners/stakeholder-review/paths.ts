/** Standalone popup route (no workspace sidebar). */
export function stakeholderReviewPath(screenerId: string) {
  return `/stakeholder-review/${screenerId}`;
}

/** @deprecated Use stakeholderReviewPath — redirects here. */
export function stakeholderReviewWorkspacePath(screenerId: string) {
  return `/workspace/screener-studio/${screenerId}/stakeholder-review`;
}

/**
 * Open stakeholder review beside the editor (reuses same named window).
 * Do not pass `noopener` in window features — browsers return null from
 * window.open() while still opening the window, which looks like a block.
 */
export function openStakeholderReviewWindow(screenerId: string): boolean {
  const url = stakeholderReviewPath(screenerId);
  const popup = window.open(
    url,
    "stakeholder-review",
    "width=1200,height=900,scrollbars=yes,resizable=yes",
  );
  if (popup == null) {
    return false;
  }
  try {
    popup.opener = null;
  } catch {
    // Cross-origin or restricted environments — opener may already be isolated.
  }
  return true;
}
