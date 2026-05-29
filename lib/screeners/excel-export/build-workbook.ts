import * as XLSX from "xlsx";

import {
  excelExportFilename,
  fetchExcelExportPayload,
  screenerTitleLine,
} from "./fetch-export-data";
import type { ExcelExportPayload } from "./types";

const RESPONDENT_ID_HEADER = "Respondent ID";

function buildWorksheetRows(payload: ExcelExportPayload): string[][] {
  const { screener, questions } = payload;
  const rows: string[][] = [];

  rows.push(["Screener response template"]);
  rows.push(["Project", screener.projectName]);
  rows.push(["Client", screener.clientName]);
  rows.push(["Screener", screenerTitleLine(payload)]);
  rows.push([]);

  const responseHeaders = [
    RESPONDENT_ID_HEADER,
    ...questions.map((q) => q.displayLabel),
  ];
  rows.push(responseHeaders);

  rows.push([
    "",
    ...questions.map((q) => q.questionText),
  ]);

  return rows;
}

export async function buildScreenerExcelWorkbook(
  screenerId: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const payload = await fetchExcelExportPayload(screenerId);
  const rows = buildWorksheetRows(payload);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

  const arrayBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;

  return {
    buffer: Buffer.from(arrayBuffer),
    filename: excelExportFilename(payload.screener.name),
  };
}
