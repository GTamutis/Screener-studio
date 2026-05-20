"use server";

import { revalidatePath } from "next/cache";

import { getScreenerById } from "@/app/actions/screeners";
import {
  cloneAnswerOptions,
  mergeAnswerOptionsPreservingMetadata,
  normalizeManualAnswerOptions,
  questionTypeHasOptions,
  type ManualScreenerQuestionType,
  type QuestionOptionFormRow,
} from "@/lib/screeners/manual-question";
import type { QuestionAnswerOption } from "@/lib/question-library/types";
import {
  mapScreenerQuestion,
  SCREENER_QUESTION_SELECT,
  type DbScreenerQuestionRow,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { normalizeWhitespace } from "@/lib/invitely/validation";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const QUESTION_TEXT_MAX = 4000;

function assertUuid(id: string, label = "id") {
  if (!UUID_RE.test(id)) throw new Error(`Invalid ${label}.`);
}

function editorPath(screenerId: string) {
  return `/workspace/screener-studio/${screenerId}`;
}

function schemaHint(errorMessage: string): string | null {
  if (
    /question_type|answer_options|is_customized|notes/i.test(errorMessage) &&
    /column|schema cache/i.test(errorMessage)
  ) {
    return "Database schema is out of date. Run migrations 011–013 in the Supabase SQL editor, then try again.";
  }
  return null;
}

type ManualQuestionPayload = {
  questionText: string;
  questionType: ManualScreenerQuestionType;
  notes?: string;
  answerOptions?: QuestionOptionFormRow[];
};

function validateManualQuestionPayload(
  input: ManualQuestionPayload,
):
  | {
      ok: true;
      questionText: string;
      notes: string | null;
      answerOptions: QuestionAnswerOptionsResult;
    }
  | { ok: false; error: string } {
  const questionText = normalizeWhitespace(input.questionText);
  if (!questionText) {
    return { ok: false, error: "Question text is required." };
  }
  if (questionText.length > QUESTION_TEXT_MAX) {
    return {
      ok: false,
      error: `Question text must be ${QUESTION_TEXT_MAX} characters or fewer.`,
    };
  }

  const notesRaw = input.notes?.trim() ?? "";
  const notes = notesRaw.length > 0 ? notesRaw : null;

  let answerOptions: ReturnType<typeof normalizeManualAnswerOptions> | null = null;

  if (questionTypeHasOptions(input.questionType)) {
    const normalized = normalizeManualAnswerOptions(input.answerOptions ?? []);
    if (normalized.length < 2) {
      return {
        ok: false,
        error: "Add at least two answer options for this question type.",
      };
    }
    answerOptions = normalized;
  }

  return { ok: true, questionText, notes, answerOptions };
}

type QuestionAnswerOptionsResult = ReturnType<
  typeof normalizeManualAnswerOptions
> | null;

async function nextScreenerQuestionPosition(
  screenerId: string,
): Promise<number> {
  const supabase = createAdminClient();
  const { data: lastQuestion, error } = await supabase
    .from("screener_questions")
    .select("position")
    .eq("screener_id", screenerId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return ((lastQuestion?.position as number | undefined) ?? 0) + 1;
}

async function renumberScreenerQuestions(
  screenerId: string,
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();
  const { data: remaining, error: fetchError } = await supabase
    .from("screener_questions")
    .select(SCREENER_QUESTION_SELECT)
    .eq("screener_id", screenerId)
    .order("position", { ascending: true });

  if (fetchError) throw new Error(fetchError.message);

  const rows = (remaining ?? []) as DbScreenerQuestionRow[];

  for (let index = 0; index < rows.length; index++) {
    const newPosition = index + 1;
    if (rows[index].position === newPosition) continue;

    const { error: updateError } = await supabase
      .from("screener_questions")
      .update({ position: newPosition })
      .eq("id", rows[index].id);

    if (updateError) throw new Error(updateError.message);
    rows[index].position = newPosition;
  }

  return rows.map((row) => mapScreenerQuestion(row));
}

export async function listScreenerQuestions(
  screenerId: string,
): Promise<ScreenerQuestion[] | { error: string }> {
  try {
    assertUuid(screenerId, "screener id");
    await getScreenerById(screenerId);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screener_questions")
      .select(SCREENER_QUESTION_SELECT)
      .eq("screener_id", screenerId)
      .order("position", { ascending: true });

    if (error) return { error: error.message };

    return (data ?? []).map((row) =>
      mapScreenerQuestion(row as DbScreenerQuestionRow),
    );
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Could not load screener questions.",
    };
  }
}

export async function addScreenerQuestionFromLibrary(input: {
  screenerId: string;
  libraryQuestionId: string;
}): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    assertUuid(input.libraryQuestionId, "library question id");
    await getScreenerById(input.screenerId);

    const supabase = createAdminClient();

    const { data: libraryQuestion, error: libraryError } = await supabase
      .from("question_library")
      .select(
        "id, question_text, question_type, answer_options, notes, is_locked, status",
      )
      .eq("id", input.libraryQuestionId)
      .eq("status", "approved")
      .maybeSingle();

    if (libraryError) return { ok: false, error: libraryError.message };
    if (!libraryQuestion) {
      return { ok: false, error: "Library question not found or not approved." };
    }

    const nextPosition = await nextScreenerQuestionPosition(input.screenerId);
    const answerOptions = cloneAnswerOptions(
      libraryQuestion.answer_options as QuestionAnswerOption[] | null,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("screener_questions")
      .insert({
        screener_id: input.screenerId,
        position: nextPosition,
        question_text: libraryQuestion.question_text,
        question_type: libraryQuestion.question_type,
        answer_options: answerOptions.length > 0 ? answerOptions : null,
        notes: libraryQuestion.notes ?? null,
        source: "library",
        is_locked: libraryQuestion.is_locked,
        library_question_id: libraryQuestion.id,
        is_customized: false,
      })
      .select(SCREENER_QUESTION_SELECT)
      .single();

    if (insertError) return { ok: false, error: insertError.message };

    revalidatePath(editorPath(input.screenerId));

    return {
      ok: true,
      question: mapScreenerQuestion(inserted as DbScreenerQuestionRow),
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not add question from library.",
    };
  }
}

export async function addManualScreenerQuestion(
  input: { screenerId: string } & ManualQuestionPayload,
): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    await getScreenerById(input.screenerId);

    const validated = validateManualQuestionPayload(input);
    if (!validated.ok) return validated;

    const supabase = createAdminClient();
    const nextPosition = await nextScreenerQuestionPosition(input.screenerId);

    const { data: inserted, error: insertError } = await supabase
      .from("screener_questions")
      .insert({
        screener_id: input.screenerId,
        position: nextPosition,
        question_text: validated.questionText,
        question_type: input.questionType,
        answer_options: validated.answerOptions,
        notes: validated.notes,
        source: "manual",
        is_locked: false,
        library_question_id: null,
        is_customized: false,
      })
      .select(SCREENER_QUESTION_SELECT)
      .single();

    if (insertError) return { ok: false, error: insertError.message };

    revalidatePath(editorPath(input.screenerId));

    return {
      ok: true,
      question: mapScreenerQuestion(inserted as DbScreenerQuestionRow),
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not add manual question.",
    };
  }
}

export async function updateScreenerQuestion(
  input: { screenerId: string; questionId: string } & ManualQuestionPayload,
): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    assertUuid(input.questionId, "question id");
    await getScreenerById(input.screenerId);

    const validated = validateManualQuestionPayload(input);
    if (!validated.ok) return validated;

    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("screener_questions")
      .select("id, answer_options")
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) {
      const hint = schemaHint(fetchError.message);
      return { ok: false, error: hint ?? fetchError.message };
    }
    if (!existing) return { ok: false, error: "Question not found." };

    let answerOptionsToSave = validated.answerOptions;
    if (questionTypeHasOptions(input.questionType) && input.answerOptions) {
      const previous = (existing.answer_options ?? []) as QuestionAnswerOption[];
      answerOptionsToSave =
        previous.length > 0
          ? mergeAnswerOptionsPreservingMetadata(
              input.answerOptions,
              previous,
            )
          : normalizeManualAnswerOptions(input.answerOptions);
    }

    const { data: updated, error: updateError } = await supabase
      .from("screener_questions")
      .update({
        question_text: validated.questionText,
        question_type: input.questionType,
        answer_options: answerOptionsToSave,
        notes: validated.notes,
        is_customized: true,
      })
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .select(SCREENER_QUESTION_SELECT)
      .single();

    if (updateError) {
      const hint = schemaHint(updateError.message);
      return { ok: false, error: hint ?? updateError.message };
    }

    revalidatePath(editorPath(input.screenerId));

    return {
      ok: true,
      question: mapScreenerQuestion(updated as DbScreenerQuestionRow),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not update question.",
    };
  }
}

export async function deleteScreenerQuestion(input: {
  screenerId: string;
  questionId: string;
}): Promise<
  | { ok: true; questions: ScreenerQuestion[] }
  | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    assertUuid(input.questionId, "question id");
    await getScreenerById(input.screenerId);

    const supabase = createAdminClient();
    const { data: question, error: fetchError } = await supabase
      .from("screener_questions")
      .select("id, is_locked")
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };
    if (!question) return { ok: false, error: "Question not found." };
    if (question.is_locked) {
      return { ok: false, error: "Locked questions cannot be deleted." };
    }

    const { error } = await supabase
      .from("screener_questions")
      .delete()
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (error) return { ok: false, error: error.message };

    const questions = await renumberScreenerQuestions(input.screenerId);

    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not delete question.",
    };
  }
}
