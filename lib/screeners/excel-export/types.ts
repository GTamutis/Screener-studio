import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export type ExcelExportQuestion = ScreenerQuestion & {
  displayLabel: string;
  isSubQuestion: boolean;
  /** Screener question label for the column header (e.g. Q1, Q2a). */
  columnHeader: string;
};

export type ExcelExportPayload = {
  screener: ScreenerWithProject;
  questions: ExcelExportQuestion[];
};
