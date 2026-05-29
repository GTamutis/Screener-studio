import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export type ExcelExportQuestion = ScreenerQuestion & {
  displayLabel: string;
  isSubQuestion: boolean;
};

export type ExcelExportPayload = {
  screener: ScreenerWithProject;
  questions: ExcelExportQuestion[];
};
