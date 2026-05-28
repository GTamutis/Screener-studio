import "server-only";

import { getScreenerById } from "@/app/actions/screeners";
import { mapScreenerQuestion, SCREENER_QUESTION_SELECT } from "@/lib/screeners/question-types";
import type { DbScreenerQuestionRow } from "@/lib/screeners/question-types";
import type { QuestionLibraryCategory } from "@/lib/question-library/types";
import { createAdminClient } from "@/lib/supabase/admin";

import type { ExportQuestion, WordExportPayload } from "./types";

export async function fetchWordExportPayload(
  screenerId: string,
): Promise<WordExportPayload> {
  const screener = await getScreenerById(screenerId);
  const supabase = createAdminClient();

  const { data: questionRows, error: questionsError } = await supabase
    .from("screener_questions")
    .select(SCREENER_QUESTION_SELECT)
    .eq("screener_id", screenerId)
    .order("position", { ascending: true });

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questions = (questionRows ?? []).map((row) =>
    mapScreenerQuestion(row as DbScreenerQuestionRow),
  );

  const libraryIds = Array.from(
    new Set(
      questions
        .map((q) => q.libraryQuestionId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const categoryByLibraryId = new Map<string, QuestionLibraryCategory>();

  if (libraryIds.length > 0) {
    const { data: libraryRows, error: libraryError } = await supabase
      .from("question_library")
      .select("id, category")
      .in("id", libraryIds);

    if (libraryError) {
      throw new Error(libraryError.message);
    }

    for (const row of libraryRows ?? []) {
      if (row.id && row.category) {
        categoryByLibraryId.set(
          row.id as string,
          row.category as QuestionLibraryCategory,
        );
      }
    }
  }

  const exportQuestions: ExportQuestion[] = questions.map((q) => ({
    ...q,
    category: q.libraryQuestionId
      ? (categoryByLibraryId.get(q.libraryQuestionId) ?? null)
      : null,
  }));

  return { screener, questions: exportQuestions };
}
