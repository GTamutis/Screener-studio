import "server-only";

import { getScreenerById } from "@/app/actions/screeners";
import {
  mapScreenerQuestion,
  SCREENER_QUESTION_SELECT,
} from "@/lib/screeners/question-types";
import type { DbScreenerQuestionRow } from "@/lib/screeners/question-types";
import { orderedExportQuestions } from "@/lib/screeners/question-tree";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatScreenerNameWithVersion } from "@/lib/screeners/version";

import type { ExcelExportPayload, ExcelExportQuestion } from "./types";

export async function fetchExcelExportPayload(
  screenerId: string,
): Promise<ExcelExportPayload> {
  const screener = await getScreenerById(screenerId);
  const supabase = createAdminClient();

  const { data: questionRows, error: questionsError } = await supabase
    .from("screener_questions")
    .select(SCREENER_QUESTION_SELECT)
    .eq("screener_id", screenerId)
    .order("position", { ascending: true })
    .order("sub_position", { ascending: true, nullsFirst: true });

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questions = (questionRows ?? []).map((row) =>
    mapScreenerQuestion(row as DbScreenerQuestionRow),
  );

  const exportQuestions: ExcelExportQuestion[] = orderedExportQuestions(
    questions,
  ).map(({ question, label, isSubQuestion }) => ({
    ...question,
    displayLabel: label,
    isSubQuestion,
  }));

  return { screener, questions: exportQuestions };
}

export function excelExportFilename(screenerName: string): string {
  const safeName = screenerName
    .replace(/[^\w\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${safeName || "screener"}-responses.xlsx`;
}

export function screenerTitleLine(
  payload: ExcelExportPayload,
): string {
  return formatScreenerNameWithVersion(payload.screener.name, {
    majorVersion: payload.screener.majorVersion,
    minorVersion: payload.screener.minorVersion,
    status: payload.screener.status,
  });
}
