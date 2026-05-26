"use server";

import { revalidatePath } from "next/cache";

import { getScreenerById } from "@/app/actions/screeners";
import {
  cloneAnswerOptions,
  normalizeManualAnswerOptions,
  questionTypeHasOptions,
  type ManualScreenerQuestionType,
  type QuestionOptionFormRow,
} from "@/lib/screeners/manual-question";
import {
  quotaConfigForSave,
  type ScreenerQuestionQuotaConfig,
} from "@/lib/screeners/question-quotas";
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
    /question_type|answer_options|is_customized|notes|quota_config/i.test(
      errorMessage,
    ) &&
    /column|schema cache/i.test(errorMessage)
  ) {
    return "Database schema is out of date. Run migrations 011–014 in the Supabase SQL editor, then try again.";
  }
  return null;
}

type ManualQuestionPayload = {
  questionText: string;
  questionType: ManualScreenerQuestionType;
  notes?: string;
  answerOptions?: QuestionOptionFormRow[];
  quotaConfig?: ScreenerQuestionQuotaConfig | null;
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

/** Avoid unique (screener_id, position) collisions while rewriting order. */
async function applyScreenerQuestionOrder(
  screenerId: string,
  orderedQuestionIds: string[],
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();
  const tempOffset = 10_000;

  for (let index = 0; index < orderedQuestionIds.length; index++) {
    const { error } = await supabase
      .from("screener_questions")
      .update({ position: tempOffset + index })
      .eq("id", orderedQuestionIds[index])
      .eq("screener_id", screenerId);

    if (error) throw new Error(error.message);
  }

  for (let index = 0; index < orderedQuestionIds.length; index++) {
    const { error } = await supabase
      .from("screener_questions")
      .update({ position: index + 1 })
      .eq("id", orderedQuestionIds[index])
      .eq("screener_id", screenerId);

    if (error) throw new Error(error.message);
  }

  const { data, error: fetchError } = await supabase
    .from("screener_questions")
    .select(SCREENER_QUESTION_SELECT)
    .eq("screener_id", screenerId)
    .order("position", { ascending: true });

  if (fetchError) throw new Error(fetchError.message);

  return (data ?? []).map((row) =>
    mapScreenerQuestion(row as DbScreenerQuestionRow),
  );
}

async function renumberScreenerQuestions(
  screenerId: string,
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();
  const { data: remaining, error: fetchError } = await supabase
    .from("screener_questions")
    .select("id")
    .eq("screener_id", screenerId)
    .order("position", { ascending: true });

  if (fetchError) throw new Error(fetchError.message);

  const orderedIds = (remaining ?? []).map((row) => row.id as string);
  if (orderedIds.length === 0) return [];

  return applyScreenerQuestionOrder(screenerId, orderedIds);
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
  return insertScreenerQuestionWithSource(input, "manual");
}

export async function addAiDraftScreenerQuestion(
  input: { screenerId: string } & ManualQuestionPayload,
): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  return insertScreenerQuestionWithSource(input, "ai_draft");
}

async function insertScreenerQuestionWithSource(
  input: { screenerId: string } & ManualQuestionPayload,
  source: "manual" | "ai_draft",
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
        source,
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
    const label =
      source === "ai_draft" ? "AI draft question" : "manual question";
    return {
      ok: false,
      error: e instanceof Error ? e.message : `Could not add ${label}.`,
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
      answerOptionsToSave = normalizeManualAnswerOptions(input.answerOptions);
    }

    const optionCount = answerOptionsToSave?.length ?? 0;
    const quotaConfigToSave = quotaConfigForSave(
      input.quotaConfig ?? { enabled: false, optionTargets: [] },
      optionCount,
    );

    const { data: updated, error: updateError } = await supabase
      .from("screener_questions")
      .update({
        question_text: validated.questionText,
        question_type: input.questionType,
        answer_options: answerOptionsToSave,
        notes: validated.notes,
        quota_config: quotaConfigToSave,
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

export async function reorderScreenerQuestions(input: {
  screenerId: string;
  orderedQuestionIds: string[];
}): Promise<
  | { ok: true; questions: ScreenerQuestion[] }
  | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    await getScreenerById(input.screenerId);

    const orderedQuestionIds = input.orderedQuestionIds.map((id) => {
      assertUuid(id, "question id");
      return id;
    });

    if (orderedQuestionIds.length === 0) {
      return { ok: true, questions: [] };
    }

    const unique = new Set(orderedQuestionIds);
    if (unique.size !== orderedQuestionIds.length) {
      return { ok: false, error: "Duplicate question ids in reorder list." };
    }

    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("screener_questions")
      .select("id")
      .eq("screener_id", input.screenerId);

    if (fetchError) return { ok: false, error: fetchError.message };

    const existingIds = (existing ?? []).map((row) => row.id as string);
    if (existingIds.length !== orderedQuestionIds.length) {
      return {
        ok: false,
        error: "Reorder list must include every question in this screener.",
      };
    }

    const existingSet = new Set(existingIds);
    for (const id of orderedQuestionIds) {
      if (!existingSet.has(id)) {
        return { ok: false, error: "One or more questions do not belong to this screener." };
      }
    }

    const questions = await applyScreenerQuestionOrder(
      input.screenerId,
      orderedQuestionIds,
    );

    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not reorder screener questions.",
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
