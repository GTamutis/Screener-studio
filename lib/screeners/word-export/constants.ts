/** Brand colours (hex without #) — WORD_EXPORT_SPEC.md §3 */
export const COLORS = {
  primaryText: "0A0C28",
  white: "FFFFFF",
  brandTeal: "00BBBA",
  brandNavy: "646EE6",
  brandYellow: "FFF06E",
  lightGreyFill: "E6E6E6",
  darkTealFill: "008996",
  midGreyFill: "767171",
  lightTealRow: "E6F8F8",
  lightYellowFill: "FFFEF1",
  lightRedRow: "FFF5F5",
  mutedGrey: "767171",
  thankClose: "C00000",
  terminate: "FF0000",
  amber: "FFC000",
} as const;

export const FONTS = {
  body: "Modern Era",
  heading: "Modern Era Medium",
  fallback: "Calibri",
} as const;

/** Half-points (11pt = 22) */
export const SIZE_BODY = 22;
export const SIZE_SECTION = 22;
export const SIZE_TITLE = 32;
export const SIZE_SUBTITLE = 28;
export const SIZE_DARK_HEADER = 24;
export const SIZE_NOTE = 20;
export const SIZE_FOOTER = 16;

/** Page — A4 portrait, margins in twips (1.2″ top = 1728 twips) */
export const PAGE = {
  width: 11906,
  height: 16838,
  marginTop: 1728,
  marginBottom: 851,
  marginLeft: 1134,
  marginRight: 1134,
  contentWidth: 9639,
} as const;

/** Standard 3-column question table (§11.1) */
export const QUESTION_TABLE_WIDTH = 8862;
export const QUESTION_COL_OPTION = 3761;
export const QUESTION_COL_CODE = 1605;
export const QUESTION_COL_ROUTING = 3496;

export const BORDER_PRIMARY = {
  style: "single" as const,
  size: 4,
  color: COLORS.primaryText,
};

export const CELL_MARGIN = {
  top: 40,
  bottom: 40,
  left: 100,
  right: 100,
};

export const DEFAULT_PARAGRAPH_SPACING = {
  after: 160,
  line: 276,
  lineRule: "auto" as const,
};
