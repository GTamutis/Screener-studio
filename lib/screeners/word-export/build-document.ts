import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  AlignmentType,
  convertMillimetersToTwip,
  Document,
  Footer,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  PageBreak,
  PageNumber,
  Paragraph,
  TextRun,
  TextWrappingSide,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  type FileChild,
} from "docx";

import {
  COLORS,
  FONTS,
  PAGE,
  SIZE_FOOTER,
} from "./constants";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import { fetchWordExportPayload } from "./fetch-export-data";
import { renderClosingRule, renderExportQuestion } from "./questions";
import {
  buildCoverBlock,
  buildImportantRespondentInstructions,
  buildInterviewerDeclaration,
  buildQuotaSummaryTable,
  buildRespondentConsentForm,
  buildRespondentDetailsBlock,
} from "./sections";
import { blankParagraph, sectionHeading } from "./styles";
import {
  SECTION_HEADINGS,
  categoryToSection,
  type DocumentSectionKey,
  type ExportQuestion,
} from "./types";

const SECTION_ORDER: DocumentSectionKey[] = [
  "introduction",
  "disclaimer",
  "consent",
  "screener",
  "scheduling",
  "closing",
];

function groupQuestionsBySection(
  questions: ExportQuestion[],
): Map<DocumentSectionKey, ExportQuestion[]> {
  const grouped = new Map<DocumentSectionKey, ExportQuestion[]>();
  for (const key of SECTION_ORDER) {
    grouped.set(key, []);
  }

  const sorted = [...questions].sort((a, b) => a.position - b.position);
  const closingStatements: ExportQuestion[] = [];

  for (const question of sorted) {
    const section = categoryToSection(question.category, question.questionType);
    if (section === "introduction" && question.questionType === "statement") {
      const isLate =
        question.position > Math.max(1, Math.floor(sorted.length * 0.75));
      if (isLate) {
        closingStatements.push(question);
        continue;
      }
    }
    grouped.get(section)?.push(question);
  }

  for (const q of closingStatements) {
    grouped.get("closing")?.push(q);
  }

  return grouped;
}

function renderSectionQuestions(sectionQuestions: ExportQuestion[]): FileChild[] {
  const parts: FileChild[] = [];
  for (const question of sectionQuestions) {
    parts.push(...renderExportQuestion(question));
  }
  return parts;
}

async function loadLogoImage(): Promise<Buffer | null> {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "brand",
      "day-one-logo-dark.png",
    );
    return await readFile(logoPath);
  } catch {
    return null;
  }
}

const EXPORT_VERSION_LABEL = "v1";

function headerMetaRun(text: string): TextRun {
  return new TextRun({
    text,
    font: FONTS.body,
    size: 16,
    color: COLORS.primaryText,
  });
}

function headerFloatingLogo(logo: Buffer): ImageRun {
  return new ImageRun({
    data: logo,
    transformation: { width: 130, height: 34 },
    type: "png",
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.MARGIN,
        align: HorizontalPositionAlign.LEFT,
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PARAGRAPH,
        align: VerticalPositionAlign.TOP,
      },
      behindDocument: true,
      allowOverlap: true,
      wrap: {
        type: TextWrappingType.SQUARE,
        side: TextWrappingSide.RIGHT,
      },
      margins: {
        right: convertMillimetersToTwip(4),
        bottom: convertMillimetersToTwip(2),
      },
    },
  });
}

function buildHeader(logo: Buffer | null, screener: ScreenerWithProject): Header {
  const projectNumber =
    screener.projectNumber.trim() || "[Project number]";
  const projectName = screener.projectName.trim() || "[Project name]";

  const metaChildren: TextRun[] = [
    headerMetaRun(projectNumber),
    new TextRun({ break: 1 }),
    headerMetaRun(projectName),
    new TextRun({ break: 1 }),
    headerMetaRun(EXPORT_VERSION_LABEL),
  ];

  const headerParagraphChildren: (ImageRun | TextRun)[] = logo
    ? [headerFloatingLogo(logo), ...metaChildren]
    : metaChildren;

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        border: {
          bottom: { style: "single", size: 6, color: COLORS.brandTeal, space: 1 },
        },
        children: headerParagraphChildren,
      }),
    ],
  });
}

function buildFooter(versionLabel: string = EXPORT_VERSION_LABEL): Footer {
  return new Footer({
    children: [
      new Paragraph({
        spacing: {
          after: 0,
          before: 0,
          line: 240,
          lineRule: "auto",
        },
        children: [
          new TextRun({
            text: "Confidential — Day One Strategy",
            font: FONTS.body,
            size: SIZE_FOOTER,
            color: COLORS.mutedGrey,
          }),
          new TextRun({ text: "\t" }),
          new TextRun({
            children: [PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
            font: FONTS.body,
            size: SIZE_FOOTER,
            color: COLORS.mutedGrey,
          }),
          new TextRun({ text: "\t" }),
          new TextRun({
            text: versionLabel,
            font: FONTS.body,
            size: SIZE_FOOTER,
            color: COLORS.mutedGrey,
          }),
        ],
      }),
    ],
  });
}

export async function buildScreenerWordDocument(
  screenerId: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const payload = await fetchWordExportPayload(screenerId);
  const { screener, questions } = payload;
  const logo = await loadLogoImage();

  const grouped = groupQuestionsBySection(questions);

  const bodyChildren: FileChild[] = [];

  if (logo) {
    bodyChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logo,
            transformation: { width: 460, height: 119 },
            type: "png",
          }),
        ],
      }),
      blankParagraph(),
    );
  }

  bodyChildren.push(...buildCoverBlock(payload));
  bodyChildren.push(...buildQuotaSummaryTable(payload));
  bodyChildren.push(...buildRespondentDetailsBlock());

  for (const sectionKey of SECTION_ORDER) {
    const sectionQuestions = grouped.get(sectionKey) ?? [];
    if (sectionQuestions.length === 0) continue;

    bodyChildren.push(sectionHeading(SECTION_HEADINGS[sectionKey]));
    bodyChildren.push(...renderSectionQuestions(sectionQuestions));
    bodyChildren.push(blankParagraph());
  }

  const closingQuestions = grouped.get("closing") ?? [];
  if (closingQuestions.length > 0) {
    bodyChildren.push(...renderClosingRule());
    for (const question of closingQuestions) {
      bodyChildren.push(...renderExportQuestion(question, { includeNumber: false }));
    }
  }

  bodyChildren.push(...buildImportantRespondentInstructions());
  bodyChildren.push(new Paragraph({ children: [new PageBreak()] }));
  bodyChildren.push(...buildRespondentConsentForm(payload));
  bodyChildren.push(...buildInterviewerDeclaration());

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONTS.body,
            size: 22,
            color: COLORS.primaryText,
          },
          paragraph: {
            spacing: { after: 160, line: 276, lineRule: "auto" },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: {
              top: PAGE.marginTop,
              bottom: PAGE.marginBottom,
              left: PAGE.marginLeft,
              right: PAGE.marginRight,
            },
          },
          titlePage: true,
        },
        headers: {
          default: buildHeader(logo, screener),
          first: new Header({ children: [] }),
        },
        footers: {
          default: buildFooter(),
          first: buildFooter(),
        },
        children: bodyChildren,
      },
    ],
  });

  const { Packer } = await import("docx");
  const buffer = await Packer.toBuffer(doc);
  const safeName = screener.name
    .replace(/[^\w\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  const filename = `${safeName || "screener"}-export.docx`;

  return { buffer: Buffer.from(buffer), filename };
}
