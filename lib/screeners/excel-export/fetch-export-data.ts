import "server-only";

import { getScreenerById } from "@/app/actions/screeners";
import {
  mapScreenerQuestion,
  SCREENER_QUESTION_SELECT,
} from "@/lib/screeners/question-types";
import type { DbScreenerQuestionRow } from "@/lib/screeners/question-types";
import { orderedExportQuestions } from "@/lib/screeners/question-tree";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatScreenerVersionLabel } from "@/lib/screeners/version";

import type { ExcelExportPayload, ExcelExportQuestion } from "./types";

function sanitizeFilenamePart(value: string, maxLength = 80): string {
  return value
    .trim()
    .replace(/[^\w\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
}

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
    columnHeader: label,
  }));

  return { screener, questions: exportQuestions };
}

/** `{projectNumber}_{projectName}-Recruitment Log_{version}.xlsx` */
export function excelExportFilename(
  screener: ExcelExportPayload["screener"],
): string {
  const projectNumber =
    sanitizeFilenamePart(screener.projectNumber.trim() || "Project", 40);
  const projectName = sanitizeFilenamePart(
    screener.projectName.trim() || screener.name.trim() || "Screener",
    60,
  );
  const version = formatScreenerVersionLabel({
    majorVersion: screener.majorVersion,
    minorVersion: screener.minorVersion,
    status: screener.status,
  });
  return `${projectNumber}_${projectName}-Recruitment Log_${version}.xlsx`;
}

export function formatUkDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function normalizeQuestionTextForCell(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
