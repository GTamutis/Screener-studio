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
  type FileChild,
} from "docx";

import { collectScreenerQuotaSummary } from "@/lib/screeners/question-quotas";

import {
  COLORS,
  FONTS,
  PAGE,
  SIZE_BODY,
  SIZE_DARK_HEADER,
  SIZE_SUBTITLE,
  SIZE_TITLE,
} from "./constants";
import { statementTextRuns } from "./inline-text";
import {
  blankParagraph,
  bodyParagraph,
  bodyRun,
  borderedTable,
  fullWidthRowTable,
  headingRun,
  placeholderRun,
  subLabelHeading,
  tableCell,
} from "./styles";
import type { WordExportPayload } from "./types";

const LABEL_WIDTH = 2268;
const VALUE_WIDTH = PAGE.contentWidth - LABEL_WIDTH;

const BORDERLESS_CELL = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
} as const;

const BORDERLESS_TABLE = {
  top: BORDERLESS_CELL.top,
  bottom: BORDERLESS_CELL.bottom,
  left: BORDERLESS_CELL.left,
  right: BORDERLESS_CELL.right,
  insideHorizontal: BORDERLESS_CELL.top,
  insideVertical: BORDERLESS_CELL.top,
};

function metadataRow(label: string, value: string, placeholder = false): TableRow {
  return new TableRow({
    cantSplit: true,
    children: [
      tableCell([bodyParagraph([bodyRun(`${label}`, { bold: true })])], {
        width: { size: LABEL_WIDTH, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "auto" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
          left: { style: BorderStyle.NONE, size: 0, color: "auto" },
          right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
      }),
      tableCell(
        [
          bodyParagraph([
            placeholder
              ? placeholderRun(value)
              : bodyRun(value),
          ]),
        ],
        {
          width: { size: VALUE_WIDTH, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
          },
        },
      ),
    ],
  });
}

export function buildCoverBlock(payload: WordExportPayload): FileChild[] {
  const { screener } = payload;
  const therapyArea = screener.projectSpecs.therapyArea.trim();
  const projectNumber =
    screener.projectNumber.trim() || "[Project number]";
  const projectName = screener.projectName.trim() || "[Project name]";

  const audienceParts = [screener.name];
  if (therapyArea) audienceParts.push(therapyArea);
  if (screener.markets.length > 0) {
    audienceParts.push(screener.markets.join(", "));
  }
  const audience = audienceParts.join(" · ");

  const titleBlock = fullWidthRowTable(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        headingRun(projectNumber, { size: SIZE_TITLE }),
        new TextRun({ break: 1 }),
        headingRun(projectName, { size: SIZE_SUBTITLE }),
        new TextRun({ break: 1 }),
        headingRun("Screener", { size: SIZE_SUBTITLE }),
        new TextRun({ break: 1 }),
        bodyRun(audience, { size: SIZE_BODY }),
      ],
    }),
    COLORS.lightGreyFill,
    PAGE.contentWidth,
  );

  const metadataTable = new Table({
    width: { size: PAGE.contentWidth, type: WidthType.DXA },
    rows: [
      metadataRow("Date:", "[Insert date completed]", true),
      metadataRow("Client:", screener.clientName || "[Client name]", !screener.clientName),
      metadataRow(
        "Project number:",
        screener.projectNumber || "[Project number]",
        !screener.projectNumber,
      ),
      metadataRow("Version:", "[Version number]", true),
    ],
  });

  return [titleBlock, metadataTable, blankParagraph()];
}

export function buildQuotaSummaryTable(payload: WordExportPayload): FileChild[] {
  const { screener, questions } = payload;
  const entries = collectScreenerQuotaSummary(questions, screener.markets).filter(
    (e) => e.hasTargets,
  );

  const markets =
    screener.markets.length > 0
      ? screener.markets
      : Array.from(
          new Set(
            entries.flatMap((e) =>
              e.options.flatMap((o) => o.markets.map((m) => m.market)),
            ),
          ),
        );

  if (markets.length === 0 && entries.length === 0) {
    return [
      subLabelHeading("Summary of quotas"),
      borderedTable([
        new TableRow({
          children: [
            tableCell(
              [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Quota targets not configured",
                      font: FONTS.body,
                      size: SIZE_BODY,
                      color: COLORS.primaryText,
                    }),
                  ],
                }),
              ],
              { shading: { fill: COLORS.brandTeal, type: ShadingType.CLEAR } },
            ),
          ],
        }),
      ]),
      blankParagraph(),
    ];
  }

  const headerCells = [
    tableCell(
      [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Segment",
              font: FONTS.heading,
              size: SIZE_BODY,
              bold: true,
              color: COLORS.white,
            }),
          ],
        }),
      ],
      { shading: { fill: COLORS.brandTeal, type: ShadingType.CLEAR } },
    ),
    ...markets.map((market) =>
      tableCell(
        [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: market,
                font: FONTS.heading,
                size: SIZE_BODY,
                bold: true,
                color: COLORS.white,
              }),
            ],
          }),
        ],
        { shading: { fill: COLORS.brandTeal, type: ShadingType.CLEAR } },
      ),
    ),
  ];

  const dataRows: TableRow[] = [];

  for (const entry of entries) {
    for (const opt of entry.options) {
      if (opt.markets.length === 0) continue;
      const targetsByMarket = new Map(opt.markets.map((m) => [m.market, m.target]));
      dataRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            tableCell([bodyParagraph([bodyRun(opt.optionText)])]),
            ...markets.map((market, colIndex) =>
              tableCell(
                [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      bodyRun(String(targetsByMarket.get(market) ?? "")),
                    ],
                  }),
                ],
                {
                  shading: {
                    fill: colIndex % 2 === 0 ? COLORS.white : COLORS.lightTealRow,
                    type: ShadingType.CLEAR,
                  },
                },
              ),
            ),
          ],
        }),
      );
    }
  }

  const totalCells = [
    tableCell(
      [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Total",
              font: FONTS.body,
              size: SIZE_BODY,
              bold: true,
              color: COLORS.white,
            }),
          ],
        }),
      ],
      { shading: { fill: COLORS.brandTeal, type: ShadingType.CLEAR } },
    ),
    ...markets.map((market) => {
      const total = entries.reduce((sum, entry) => {
        for (const opt of entry.options) {
          const match = opt.markets.find((m) => m.market === market);
          if (match) sum += match.target;
        }
        return sum;
      }, 0);
      return tableCell(
        [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: total > 0 ? String(total) : "",
                font: FONTS.body,
                size: SIZE_BODY,
                bold: true,
                color: COLORS.white,
              }),
            ],
          }),
        ],
        { shading: { fill: COLORS.brandTeal, type: ShadingType.CLEAR } },
      );
    }),
  ];

  return [
    subLabelHeading("Summary of quotas"),
    borderedTable(
      [
        new TableRow({ cantSplit: true, children: headerCells }),
        ...dataRows,
        new TableRow({ cantSplit: true, children: totalCells }),
      ],
      { width: { size: PAGE.contentWidth, type: WidthType.DXA } },
    ),
    blankParagraph(),
  ];
}

export function buildRespondentDetailsBlock(): FileChild[] {
  const fields = [
    "Respondent name",
    "Respondent type",
    "Telephone",
    "Email",
    "Date of interview",
    "Time of interview",
  ];

  const rows = fields.map((label) =>
    new TableRow({
      cantSplit: true,
      children: [
        tableCell([bodyParagraph([bodyRun(`${label}:`, { bold: true })])], {
          width: { size: 2835, type: WidthType.DXA },
        }),
        tableCell([new Paragraph({ children: [] })]),
      ],
    }),
  );

  return [
    subLabelHeading("Participant details"),
    bodyParagraph([
      "Please complete all details below about the respondent, time, and the date of the interview.",
    ]),
    borderedTable(rows, { width: { size: PAGE.contentWidth, type: WidthType.DXA } }),
    blankParagraph(),
  ];
}

export function buildImportantRespondentInstructions(): FileChild[] {
  const bullets = [
    "Please read each question carefully and answer as accurately as possible.",
    "Your responses will be kept confidential and used for research purposes only.",
    "If you are unsure about any question, please ask the interviewer before answering.",
  ];

  return [
    borderedTable(
      [
        new TableRow({
          cantSplit: true,
          children: [
            tableCell(
              [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "IMPORTANT RESPONDENT INSTRUCTIONS:",
                      font: FONTS.heading,
                      size: SIZE_BODY,
                      bold: true,
                      color: COLORS.primaryText,
                    }),
                  ],
                }),
                ...bullets.map(
                  (text) =>
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [
                        bodyRun("– "),
                        ...statementTextRuns(text),
                      ],
                    }),
                ),
              ],
              {
                shading: { fill: COLORS.lightYellowFill, type: ShadingType.CLEAR },
              },
            ),
          ],
        }),
      ],
      {
        width: { size: PAGE.contentWidth, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.primaryText },
          bottom: {
            style: BorderStyle.SINGLE,
            size: 8,
            color: COLORS.primaryText,
          },
          left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.primaryText },
          right: {
            style: BorderStyle.SINGLE,
            size: 8,
            color: COLORS.primaryText,
          },
        },
      },
    ),
    blankParagraph(),
  ];
}

export function buildRespondentConsentForm(payload: WordExportPayload): FileChild[] {
  const { screener } = payload;

  const titleRow = fullWidthRowTable(
    new Paragraph({
      children: [
        new TextRun({
          text: "Respondent Consent",
          font: FONTS.heading,
          size: SIZE_DARK_HEADER,
          bold: true,
          color: COLORS.white,
        }),
      ],
    }),
    COLORS.midGreyFill,
    PAGE.contentWidth,
  );

  const projectDetails = new Table({
    width: { size: PAGE.contentWidth, type: WidthType.DXA },
    rows: [
      metadataRow("Project Title:", screener.projectName || "[Project title]", !screener.projectName),
      metadataRow(
        "Project No:",
        screener.projectNumber || "[Project number]",
        !screener.projectNumber,
      ),
      metadataRow("Agency:", "Day One Strategy", false),
      metadataRow("Location of Fieldwork:", "[Location of fieldwork]", true),
      metadataRow("Date of Fieldwork:", "[Date of fieldwork]", true),
      metadataRow("Start Time:", "[Start time]", true),
    ],
  });

  const consentStatements = [
    "Data processing: I understand how my personal data will be processed for this research study.",
    "Live viewing: I understand that observers may view the interview live.",
    "Recording: I consent to audio/video recording where applicable.",
    "Stimulus: I understand that confidential client materials may be shown during the interview.",
    "Confidentiality: I agree to keep study materials and discussion content confidential.",
  ];

  const consentItems: FileChild[] = consentStatements.map((text) =>
    borderedTable([
      new TableRow({
        cantSplit: true,
        children: [
          tableCell(
            [new Paragraph({ children: statementTextRuns(text) })],
            {
              width: {
                size: Math.floor(PAGE.contentWidth * 0.8),
                type: WidthType.DXA,
              },
            },
          ),
          tableCell(
            [
              new Paragraph({
                children: [bodyRun("☐ Yes   ☐ No")],
              }),
            ],
            {
              width: {
                size: Math.floor(PAGE.contentWidth * 0.2),
                type: WidthType.DXA,
              },
              verticalAlign: VerticalAlign.CENTER,
            },
          ),
        ],
      }),
    ]),
  );

  const signatureHeader = fullWidthRowTable(
    new Paragraph({
      children: [
        new TextRun({
          text: "Signature",
          font: FONTS.heading,
          size: SIZE_DARK_HEADER,
          bold: true,
          color: COLORS.white,
        }),
      ],
    }),
    COLORS.darkTealFill,
    PAGE.contentWidth,
  );

  const signatureRow = borderedTable([
    new TableRow({
      cantSplit: true,
      children: [
        tableCell([
          bodyParagraph([
            bodyRun(
              "Respondent Signature: _________________ / Name (please print): _________________",
            ),
          ]),
        ]),
        tableCell([
          bodyParagraph([
            bodyRun(
              "Agency Signature: _________________ / Name (please print): _________________",
            ),
          ]),
        ]),
      ],
    }),
  ]);

  return [
    titleRow,
    projectDetails,
    blankParagraph(),
    ...consentItems,
    signatureHeader,
    signatureRow,
    blankParagraph(),
  ];
}

export function buildInterviewerDeclaration(): FileChild[] {
  const fields = [
    "INTERVIEWER NAME: ___________________________",
    "Signed: ___________________________",
    "Date: ___________________________",
  ];

  return fields.map((line) => {
    const [label, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    return new Paragraph({
      spacing: { after: 160 },
      children: [
        bodyRun(`${label}:`, { bold: true }),
        bodyRun(` ${value}`),
      ],
    });
  });
}
