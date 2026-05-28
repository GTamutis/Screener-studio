import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type IParagraphOptions,
  type IRunOptions,
  type ITableCellOptions,
  type ITableOptions,
} from "docx";

import {
  BORDER_PRIMARY,
  CELL_MARGIN,
  COLORS,
  DEFAULT_PARAGRAPH_SPACING,
  FONTS,
  SIZE_BODY,
} from "./constants";

export function bodyRun(text: string, overrides: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({
    font: FONTS.body,
    size: SIZE_BODY,
    color: COLORS.primaryText,
    text,
    ...overrides,
  });
}

export function headingRun(text: string, overrides: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({
    font: FONTS.heading,
    size: SIZE_BODY,
    color: COLORS.primaryText,
    bold: true,
    text,
    ...overrides,
  });
}

export function placeholderRun(text: string): TextRun {
  return new TextRun({
    font: FONTS.body,
    size: SIZE_BODY,
    color: COLORS.brandNavy,
    bold: true,
    highlight: "yellow",
    text,
  });
}

export function bodyParagraph(
  children: (TextRun | string)[],
  options: Partial<IParagraphOptions> = {},
): Paragraph {
  const runs = children.map((child) =>
    typeof child === "string" ? bodyRun(child) : child,
  );
  return new Paragraph({
    spacing: DEFAULT_PARAGRAPH_SPACING,
    children: runs,
    ...options,
  });
}

export function blankParagraph(): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 240 },
    children: [],
  });
}

export function standardBorder() {
  return {
    top: BORDER_PRIMARY,
    bottom: BORDER_PRIMARY,
    left: BORDER_PRIMARY,
    right: BORDER_PRIMARY,
  };
}

export function tableCell(
  children: Paragraph[],
  options: Partial<ITableCellOptions> = {},
): TableCell {
  return new TableCell({
    margins: CELL_MARGIN,
    verticalAlign: VerticalAlign.CENTER,
    children,
    ...options,
  });
}

export function borderedTable(
  rows: TableRow[],
  options: Partial<ITableOptions> = {},
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: BORDER_PRIMARY,
      bottom: BORDER_PRIMARY,
      left: BORDER_PRIMARY,
      right: BORDER_PRIMARY,
      insideHorizontal: BORDER_PRIMARY,
      insideVertical: BORDER_PRIMARY,
    },
    ...options,
  });
}

export function fullWidthRowTable(
  paragraph: Paragraph,
  fill: string,
  widthTwips: number,
): Table {
  return new Table({
    width: { size: widthTwips, type: WidthType.DXA },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          tableCell([paragraph], {
            width: { size: widthTwips, type: WidthType.DXA },
            shading: { fill, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
          }),
        ],
      }),
    ],
  });
}

export function sectionHeading(
  text: string,
  color: string = COLORS.brandNavy,
): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONTS.heading,
        size: SIZE_BODY,
        bold: true,
        allCaps: true,
        color,
      }),
    ],
  });
}

export function subLabelHeading(text: string): Paragraph {
  return sectionHeading(text, COLORS.primaryText);
}

export function centeredParagraph(children: TextRun[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: DEFAULT_PARAGRAPH_SPACING,
    children,
  });
}
