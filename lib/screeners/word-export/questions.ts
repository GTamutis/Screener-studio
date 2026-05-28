import {
  AlignmentType,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
  type ITableCellOptions,
} from "docx";

import type { QuestionAnswerOption } from "@/lib/question-library/types";
import type { QuestionLibraryType } from "@/lib/question-library/types";
import { questionLabel } from "@/lib/screeners/question-types";

import {
  COLORS,
  FONTS,
  PAGE,
  QUESTION_COL_CODE,
  QUESTION_COL_OPTION,
  QUESTION_COL_ROUTING,
  QUESTION_TABLE_WIDTH,
  SIZE_BODY,
} from "./constants";
import { statementTextRuns, programmingNoteParagraphText } from "./inline-text";
import { resolveRoutingStyle } from "./routing";
import {
  blankParagraph,
  bodyParagraph,
  bodyRun,
  borderedTable,
  tableCell,
} from "./styles";
import type { ExportQuestion } from "./types";

function questionNumberPrefix(position: number): string {
  return `${questionLabel(position)}. `;
}

function questionHeaderParagraph(question: ExportQuestion): Paragraph {
  const children: TextRun[] = [
    bodyRun(questionNumberPrefix(question.position), { bold: true }),
    ...statementTextRuns(question.questionText),
  ];

  if (question.questionType === "multi") {
    children.push(
      new TextRun({
        text: " Select all that apply.",
        font: FONTS.body,
        size: SIZE_BODY,
        italics: true,
        color: COLORS.primaryText,
      }),
    );
  }

  return new Paragraph({
    spacing: { before: 120, after: 120 },
    keepNext: true,
    children,
  });
}

/** Tight paragraph for table cells so vertical centring reads correctly in Word. */
function tableCellParagraph(
  runs: TextRun[],
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
): Paragraph {
  return new Paragraph({
    alignment,
    spacing: { before: 0, after: 0 },
    children: runs,
  });
}

function answerTableCell(
  paragraphs: Paragraph[],
  widthTwips: number,
  extra?: Partial<ITableCellOptions>,
): TableCell {
  return tableCell(paragraphs, {
    width: { size: widthTwips, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    ...extra,
  });
}

/** Space after an answer table before the next question (~4pt). */
const TABLE_GAP_AFTER = 80;

function routingRun(style: NonNullable<ReturnType<typeof resolveRoutingStyle>>): TextRun {
  return new TextRun({
    text: style.allCaps ? style.text.toUpperCase() : style.text,
    font: FONTS.body,
    size: SIZE_BODY,
    bold: style.bold,
    color: style.color,
  });
}

function answerOptionsTable(options: QuestionAnswerOption[]): Table {
  const rows = options
    .filter((o) => o.text.trim().length > 0)
    .map((option, index) => {
      const routing = resolveRoutingStyle(option);

      return new TableRow({
        cantSplit: true,
        children: [
          answerTableCell(
            [
              tableCellParagraph([
                bodyRun(option.text.replace(/_{3,}/g, "____________")),
              ]),
            ],
            QUESTION_COL_OPTION,
          ),
          answerTableCell(
            [
              tableCellParagraph(
                [bodyRun(String(index + 1))],
                AlignmentType.CENTER,
              ),
            ],
            QUESTION_COL_CODE,
          ),
          answerTableCell(
            [
              tableCellParagraph(routing ? [routingRun(routing)] : []),
            ],
            QUESTION_COL_ROUTING,
          ),
        ],
      });
    });

  return borderedTable(rows, {
    width: { size: QUESTION_TABLE_WIDTH, type: WidthType.DXA },
  });
}

function openEndedEntryTable(): Table {
  return borderedTable([
    new TableRow({
      cantSplit: true,
      children: [
        answerTableCell(
          [
            tableCellParagraph([
              new TextRun({
                text: "Enter response here:",
                font: FONTS.body,
                size: SIZE_BODY,
                italics: true,
                color: COLORS.mutedGrey,
              }),
            ]),
          ],
          PAGE.contentWidth,
          {
            shading: { fill: COLORS.lightGreyFill, type: ShadingType.CLEAR },
          },
        ),
      ],
    }),
  ]);
}

function gridQuestionTable(question: ExportQuestion, position: number): Table {
  const options = question.answerOptions.filter((o) => o.text.trim());
  const headerCells = [
    tableCell([bodyParagraph([bodyRun("")])], {
      shading: { fill: COLORS.darkTealFill, type: ShadingType.CLEAR },
    }),
    ...options.map((opt) =>
      tableCell(
        [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: opt.text,
                font: FONTS.heading,
                size: SIZE_BODY,
                bold: true,
                color: COLORS.white,
              }),
            ],
          }),
        ],
        {
          shading: { fill: COLORS.darkTealFill, type: ShadingType.CLEAR },
        },
      ),
    ),
  ];

  const dataRow = new TableRow({
    cantSplit: true,
    children: [
      tableCell([
        bodyParagraph([
          bodyRun(questionNumberPrefix(position), { bold: true }),
          ...statementTextRuns(question.questionText),
        ]),
      ]),
      ...options.map((_, colIndex) =>
        tableCell(
          [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [bodyRun("☐")],
            }),
          ],
          {
            shading: {
              fill: colIndex % 2 === 1 ? COLORS.lightTealRow : COLORS.white,
              type: ShadingType.CLEAR,
            },
          },
        ),
      ),
    ],
  });

  return borderedTable(
    [
      new TableRow({ cantSplit: true, children: headerCells }),
      dataRow,
    ],
    { width: { size: PAGE.contentWidth, type: WidthType.DXA } },
  );
}

function renderStatement(question: ExportQuestion): FileChild[] {
  return [
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: statementTextRuns(question.questionText),
    }),
  ];
}

function renderQuestionBody(question: ExportQuestion): FileChild[] {
  const type: QuestionLibraryType | null = question.questionType;

  if (type === "statement") {
    return renderStatement(question);
  }

  if (type === "grid") {
    return [gridQuestionTable(question, question.position)];
  }

  const hasOptions =
    type === "single" ||
    type === "multi" ||
    (question.answerOptions.length > 0 &&
      type !== "open" &&
      type !== "numeric" &&
      type !== "scale");

  if (!hasOptions) {
    return [openEndedEntryTable()];
  }

  return [answerOptionsTable(question.answerOptions)];
}

function recruitingNotesBlock(question: ExportQuestion): FileChild[] {
  const note = question.notes?.trim();
  if (!note) return [];

  return [
    new Paragraph({
      spacing: { before: 80, after: 160 },
      children: programmingNoteParagraphText(note),
    }),
  ];
}

export function renderExportQuestion(
  question: ExportQuestion,
  options?: { includeNumber?: boolean },
): FileChild[] {
  const includeNumber = options?.includeNumber ?? true;
  const parts: FileChild[] = [];

  if (
    includeNumber &&
    question.questionType !== "statement" &&
    question.questionType !== "grid"
  ) {
    parts.push(questionHeaderParagraph(question));
  }

  const body = renderQuestionBody(question);
  parts.push(...body);

  if (questionHasAnswerTable(question)) {
    parts.push(
      new Paragraph({
        spacing: { after: TABLE_GAP_AFTER },
        children: [],
      }),
    );
  }

  parts.push(...recruitingNotesBlock(question));

  return parts;
}

function questionHasAnswerTable(question: ExportQuestion): boolean {
  const type = question.questionType;
  if (type === "single" || type === "multi") return true;
  if (type === "grid") return true;
  if (type === "open" || type === "numeric" || type === "scale") return true;
  return (
    question.answerOptions.length > 0 &&
    type !== "statement"
  );
}

export function renderClosingRule(): FileChild[] {
  return [
    borderedTable(
      [
        new TableRow({
          children: [
            tableCell([], {
              borders: {
                bottom: { style: "single", size: 4, color: COLORS.primaryText },
                top: { style: "none", size: 0, color: "auto" },
                left: { style: "none", size: 0, color: "auto" },
                right: { style: "none", size: 0, color: "auto" },
              },
            }),
          ],
        }),
      ],
      { width: { size: PAGE.contentWidth, type: WidthType.DXA } },
    ),
    blankParagraph(),
  ];
}
