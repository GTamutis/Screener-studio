import ExcelJS from "exceljs";

import {
  CHECKBOX_COLUMN_NUMBERS,
  COLORS,
  CORE_COLUMNS,
  DATA_ROW_COUNT,
  FIRST_DATA_ROW,
  FIXED_CORE_COLUMN_COUNT,
  FONT,
  GROUP_HEADER_ROW,
  HEADER_ROW,
  MARKER_ROW,
  SCREENER_RESPONSE_COLUMN_WIDTH,
  STATUS_CONDITIONAL_RULES,
  STATUS_VALIDATION_LIST,
  SUB_HEADER_ROW,
  SYSTEM_MARKER,
} from "./constants";
import {
  excelExportFilename,
  fetchExcelExportPayload,
  formatUkDate,
  normalizeQuestionTextForCell,
} from "./fetch-export-data";
import type { ExcelExportPayload } from "./types";

const FROZEN_HEADER_ROWS = 8;

function colLetter(column: number): string {
  let n = column;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function solidFill(argb: string): ExcelJS.Fill {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  };
}

function tableBorderSides(medium = false): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = {
    style: medium ? "medium" : "thin",
    color: { argb: medium ? COLORS.borderMedium : COLORS.borderTable },
  };
  return { top: side, left: side, bottom: side, right: side };
}

function applyTableBorder(cell: ExcelJS.Cell, medium = false): void {
  cell.border = tableBorderSides(medium);
}

function applyFont(
  cell: ExcelJS.Cell,
  options: {
    size: number;
    bold?: boolean;
    color?: string;
    italic?: boolean;
  },
): void {
  cell.font = {
    name: FONT,
    size: options.size,
    bold: options.bold ?? false,
    italic: options.italic ?? false,
    color: options.color ? { argb: options.color } : undefined,
  };
}

function applyCheckboxCell(cell: ExcelJS.Cell): void {
  cell.value = "☐";
  applyFont(cell, { size: 11, color: COLORS.titleText });
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: ['"☐,☑"'],
    showErrorMessage: false,
    showInputMessage: false,
  };
}

function buildWorkbookFromPayload(
  payload: ExcelExportPayload,
  exportedAt: Date,
): ExcelJS.Workbook {
  const { screener, questions } = payload;
  const responseColumnCount = questions.length;
  const totalColumns = FIXED_CORE_COLUMN_COUNT + responseColumnCount;
  const lastDataRow = FIRST_DATA_ROW + DATA_ROW_COUNT - 1;
  const checkboxColumns = new Set<number>(CHECKBOX_COLUMN_NUMBERS);

  const systemColumnIndices: number[] = [];
  for (let col = 1; col <= totalColumns; col += 1) {
    systemColumnIndices.push(col);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Screener Studio";
  workbook.created = exportedAt;

  const sheet = workbook.addWorksheet("Interview Schedule", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  CORE_COLUMNS.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width;
  });
  for (let col = FIXED_CORE_COLUMN_COUNT + 1; col <= totalColumns; col += 1) {
    sheet.getColumn(col).width = SCREENER_RESPONSE_COLUMN_WIDTH;
  }

  const lastColLetter = colLetter(totalColumns);

  // Row 1 — title
  sheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${screener.projectName} — Recruitment Log`;
  applyFont(titleCell, { size: 14, bold: true, color: COLORS.titleText });
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 24;

  // Row 2 — export date
  sheet.mergeCells(`A2:${lastColLetter}2`);
  const dateCell = sheet.getCell("A2");
  dateCell.value = `Exported: ${formatUkDate(exportedAt)}`;
  applyFont(dateCell, { size: 10, color: COLORS.mutedText });
  dateCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(2).height = 16;

  sheet.getRow(3).height = 8;
  sheet.getRow(4).height = 8;

  const markerRow = sheet.getRow(MARKER_ROW);
  markerRow.height = 8;
  markerRow.hidden = true;

  // Row 6 — column group headers
  const groupRow = sheet.getRow(GROUP_HEADER_ROW);
  groupRow.height = 20;

  const groupDefs = [
    { label: "Respondent", startCol: 1, endCol: 2 },
    { label: "Profile", startCol: 3, endCol: 4 },
    { label: "Scheduling", startCol: 5, endCol: 8 },
    { label: "Fieldwork", startCol: 9, endCol: 9 },
    { label: "Recording Processing", startCol: 10, endCol: 13 },
  ];

  if (responseColumnCount > 0) {
    groupDefs.push({
      label: "Screener Responses",
      startCol: FIXED_CORE_COLUMN_COUNT + 1,
      endCol: totalColumns,
    });
  }

  for (const group of groupDefs) {
    const start = colLetter(group.startCol);
    const end = colLetter(group.endCol);
    if (group.startCol !== group.endCol) {
      sheet.mergeCells(`${start}${GROUP_HEADER_ROW}:${end}${GROUP_HEADER_ROW}`);
    }
    const cell = sheet.getCell(`${start}${GROUP_HEADER_ROW}`);
    cell.value = group.label;
    applyFont(cell, { size: 10, bold: true, color: COLORS.white });
    cell.fill = solidFill(COLORS.brandBlue);
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    applyTableBorder(cell, true);
  }

  // Row 7 — column labels (screener uses Q1 / Q2a, not library display_id)
  const headerRow = sheet.getRow(HEADER_ROW);
  headerRow.height = 36;

  CORE_COLUMNS.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    applyFont(cell, { size: 10, bold: true, color: COLORS.white });
    cell.fill = solidFill(COLORS.darkNavy);
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    applyTableBorder(cell, true);
  });

  questions.forEach((question, index) => {
    const col = FIXED_CORE_COLUMN_COUNT + 1 + index;
    const cell = headerRow.getCell(col);
    cell.value = question.columnHeader;
    applyFont(cell, { size: 10, bold: true, color: COLORS.white });
    cell.fill = solidFill(COLORS.darkNavy);
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: false,
    };
    applyTableBorder(cell, true);
  });

  // Row 8 — sub-headers + full question text (fixed height; read in formula bar when selected)
  const subHeaderRow = sheet.getRow(SUB_HEADER_ROW);
  subHeaderRow.height = 18;

  for (let col = 1; col <= totalColumns; col += 1) {
    const cell = subHeaderRow.getCell(col);
    applyFont(cell, { size: 9, color: COLORS.white });
    cell.fill = solidFill(COLORS.mediumBlue);
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: false,
      shrinkToFit: false,
    };
    applyTableBorder(cell, true);

    if (col === 6) cell.value = "EST";
    if (col === 7) cell.value = "Local";
  }

  questions.forEach((question, index) => {
    const col = FIXED_CORE_COLUMN_COUNT + 1 + index;
    const cell = subHeaderRow.getCell(col);
    cell.value = normalizeQuestionTextForCell(question.questionText);
    applyFont(cell, {
      size: 8,
      color: COLORS.white,
      italic: true,
    });
    cell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: false,
      shrinkToFit: false,
    };
  });

  // Data rows 9+
  for (let rowIndex = 0; rowIndex < DATA_ROW_COUNT; rowIndex += 1) {
    const rowNumber = FIRST_DATA_ROW + rowIndex;
    const row = sheet.getRow(rowNumber);
    row.height = 18;
    const isAlt = rowIndex % 2 === 1;
    const rowFill = isAlt ? COLORS.altRowGrey : COLORS.white;

    for (let col = 1; col <= totalColumns; col += 1) {
      const cell = row.getCell(col);

      if (checkboxColumns.has(col)) {
        applyCheckboxCell(cell);
        cell.fill = solidFill(rowFill);
        applyTableBorder(cell);
        continue;
      }

      applyFont(cell, { size: 10, color: COLORS.titleText });
      cell.fill = solidFill(rowFill);
      cell.alignment = { horizontal: "left", vertical: "middle", wrapText: false };
      applyTableBorder(cell);

      if (col === 5 || col === 12) {
        cell.numFmt = "dd/mm/yyyy";
      }
      if (col === 6 || col === 7) {
        cell.numFmt = "hh:mm";
      }
    }
  }

  for (const colIdx of systemColumnIndices) {
    markerRow.getCell(colIdx).value = SYSTEM_MARKER;
  }

  for (let row = FIRST_DATA_ROW; row <= lastDataRow; row += 1) {
    const cell = sheet.getCell(row, 2);
    cell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${STATUS_VALIDATION_LIST}"`],
    };
  }

  const dataRange = `A${FIRST_DATA_ROW}:${lastColLetter}${lastDataRow}`;
  sheet.addConditionalFormatting({
    ref: dataRange,
    rules: STATUS_CONDITIONAL_RULES.map((rule, index) => ({
      type: "expression",
      priority: index + 1,
      formulae: [`=$B${FIRST_DATA_ROW}="${rule.value}"`],
      style: {
        fill: {
          type: "pattern",
          pattern: "solid",
          bgColor: { argb: rule.fill },
        },
        font: {
          name: FONT,
          size: 10,
          color: { argb: rule.font },
          bold: rule.bold ?? false,
        },
      },
    })),
  });

  sheet.views = [
    {
      state: "frozen",
      xSplit: 2,
      ySplit: FROZEN_HEADER_ROWS,
      topLeftCell: "C9",
      activeCell: "C9",
    },
  ];

  sheet.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: HEADER_ROW, column: totalColumns },
  };

  return workbook;
}

export async function buildScreenerExcelWorkbook(
  screenerId: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const payload = await fetchExcelExportPayload(screenerId);
  const exportedAt = new Date();
  const workbook = buildWorkbookFromPayload(payload, exportedAt);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return {
    buffer,
    filename: excelExportFilename(payload.screener),
  };
}
