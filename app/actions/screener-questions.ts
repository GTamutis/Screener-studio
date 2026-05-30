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
import { isConsentBuilderCategoryAndTags } from "@/lib/question-library/consent-builder";
import type { QuestionLibraryCategory } from "@/lib/question-library/types";
import type { QuestionAnswerOption } from "@/lib/question-library/types";
import {
  mapScreenerQuestion,
  SCREENER_QUESTION_SELECT,
  type DbScreenerQuestionRow,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { sortScreenerQuestions } from "@/lib/screeners/question-tree";
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
    /question_type|answer_options|is_customized|notes|quota_config|parent_id|sub_position/i.test(
      errorMessage,
    ) &&
    /column|schema cache/i.test(errorMessage)
  ) {
    return "Database schema is out of date. Run the latest Supabase migrations, then try again.";
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

async function fetchScreenerQuestionsOrdered(
  screenerId: string,
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("screener_questions")
    .select(SCREENER_QUESTION_SELECT)
    .eq("screener_id", screenerId)
    .order("position", { ascending: true })
    .order("sub_position", { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);

  return sortScreenerQuestions(
    (data ?? []).map((row) =>
      mapScreenerQuestion(row as DbScreenerQuestionRow),
    ),
  );
}

async function fetchConsentPoolLibraryIds(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<Set<string>> {
  const { data: libraryRows, error } = await supabase
    .from("question_library")
    .select("id, category, tags")
    .eq("status", "approved");

  if (error) throw new Error(error.message);

  return new Set(
    (libraryRows ?? [])
      .filter((row) =>
        isConsentBuilderCategoryAndTags(
          row.category as QuestionLibraryCategory,
          row.tags as string[] | null,
        ),
      )
      .map((row) => row.id as string),
  );
}

async function screenerQuestionMayDeleteDespiteLock(
  supabase: ReturnType<typeof createAdminClient>,
  screenerId: string,
  questionId: string,
  consentPoolIds?: Set<string>,
): Promise<boolean> {
  const { data: row, error } = await supabase
    .from("screener_questions")
    .select("library_question_id, parent_id")
    .eq("id", questionId)
    .eq("screener_id", screenerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row?.library_question_id || row.parent_id) return false;

  const pool = consentPoolIds ?? (await fetchConsentPoolLibraryIds(supabase));
  return pool.has(row.library_question_id as string);
}

async function nextTopLevelQuestionPosition(
  screenerId: string,
): Promise<number> {
  const supabase = createAdminClient();
  const { data: lastQuestion, error } = await supabase
    .from("screener_questions")
    .select("position")
    .eq("screener_id", screenerId)
    .is("parent_id", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return ((lastQuestion?.position as number | undefined) ?? 0) + 1;
}

async function nextSubQuestionPosition(
  screenerId: string,
  parentId: string,
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("screener_questions")
    .select("id", { count: "exact", head: true })
    .eq("screener_id", screenerId)
    .eq("parent_id", parentId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function validateParentQuestion(
  screenerId: string,
  parentId: string,
): Promise<{ ok: true; position: number } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { data: parent, error } = await supabase
    .from("screener_questions")
    .select("id, parent_id, position")
    .eq("id", parentId)
    .eq("screener_id", screenerId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!parent) return { ok: false, error: "Parent question not found." };
  if (parent.parent_id) {
    return {
      ok: false,
      error: "Sub-questions cannot have their own sub-questions.",
    };
  }

  return { ok: true, position: parent.position as number };
}

/** Avoid unique (screener_id, position) collisions while rewriting top-level order. */
async function applyTopLevelQuestionOrder(
  screenerId: string,
  orderedTopLevelIds: string[],
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();
  const tempOffset = 10_000;

  for (let index = 0; index < orderedTopLevelIds.length; index++) {
    const newPosition = index + 1;
    const questionId = orderedTopLevelIds[index];

    const { error: parentError } = await supabase
      .from("screener_questions")
      .update({ position: tempOffset + newPosition })
      .eq("id", questionId)
      .eq("screener_id", screenerId)
      .is("parent_id", null);

    if (parentError) throw new Error(parentError.message);

    const { error: childrenError } = await supabase
      .from("screener_questions")
      .update({ position: tempOffset + newPosition })
      .eq("parent_id", questionId)
      .eq("screener_id", screenerId);

    if (childrenError) throw new Error(childrenError.message);
  }

  for (let index = 0; index < orderedTopLevelIds.length; index++) {
    const newPosition = index + 1;
    const questionId = orderedTopLevelIds[index];

    const { error: parentError } = await supabase
      .from("screener_questions")
      .update({ position: newPosition })
      .eq("id", questionId)
      .eq("screener_id", screenerId)
      .is("parent_id", null);

    if (parentError) throw new Error(parentError.message);

    const { error: childrenError } = await supabase
      .from("screener_questions")
      .update({ position: newPosition })
      .eq("parent_id", questionId)
      .eq("screener_id", screenerId);

    if (childrenError) throw new Error(childrenError.message);
  }

  return fetchScreenerQuestionsOrdered(screenerId);
}

async function applySubQuestionOrder(
  screenerId: string,
  parentId: string,
  orderedSubIds: string[],
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();

  for (let index = 0; index < orderedSubIds.length; index++) {
    const { error } = await supabase
      .from("screener_questions")
      .update({ sub_position: index })
      .eq("id", orderedSubIds[index])
      .eq("screener_id", screenerId)
      .eq("parent_id", parentId);

    if (error) throw new Error(error.message);
  }

  return fetchScreenerQuestionsOrdered(screenerId);
}

async function renumberTopLevelQuestions(
  screenerId: string,
): Promise<ScreenerQuestion[]> {
  const supabase = createAdminClient();
  const { data: remaining, error: fetchError } = await supabase
    .from("screener_questions")
    .select("id")
    .eq("screener_id", screenerId)
    .is("parent_id", null)
    .order("position", { ascending: true });

  if (fetchError) throw new Error(fetchError.message);

  const orderedIds = (remaining ?? []).map((row) => row.id as string);
  if (orderedIds.length === 0) return fetchScreenerQuestionsOrdered(screenerId);

  return applyTopLevelQuestionOrder(screenerId, orderedIds);
}

export async function listScreenerQuestions(
  screenerId: string,
): Promise<ScreenerQuestion[] | { error: string }> {
  try {
    assertUuid(screenerId, "screener id");
    await getScreenerById(screenerId);
    return await fetchScreenerQuestionsOrdered(screenerId);
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
  parentId?: string | null;
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

    let position: number;
    let parentId: string | null = null;
    let subPosition: number | null = null;

    if (input.parentId) {
      assertUuid(input.parentId, "parent id");
      const parentCheck = await validateParentQuestion(
        input.screenerId,
        input.parentId,
      );
      if (!parentCheck.ok) return parentCheck;
      parentId = input.parentId;
      position = parentCheck.position;
      subPosition = await nextSubQuestionPosition(input.screenerId, parentId);
    } else {
      position = await nextTopLevelQuestionPosition(input.screenerId);
    }

    const answerOptions = cloneAnswerOptions(
      libraryQuestion.answer_options as QuestionAnswerOption[] | null,
    );

    const { data: inserted, error: insertError } = await supabase
      .from("screener_questions")
      .insert({
        screener_id: input.screenerId,
        position,
        parent_id: parentId,
        sub_position: subPosition,
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

    if (insertError) {
      const hint = schemaHint(insertError.message);
      return { ok: false, error: hint ?? insertError.message };
    }

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

async function insertLibraryQuestionAtPosition(
  screenerId: string,
  libraryQuestionId: string,
  position: number,
): Promise<ScreenerQuestion> {
  const supabase = createAdminClient();

  const { data: libraryQuestion, error: libraryError } = await supabase
    .from("question_library")
    .select(
      "id, question_text, question_type, answer_options, notes, is_locked, status",
    )
    .eq("id", libraryQuestionId)
    .eq("status", "approved")
    .maybeSingle();

  if (libraryError) throw new Error(libraryError.message);
  if (!libraryQuestion) {
    throw new Error("Library question not found or not approved.");
  }

  const answerOptions = cloneAnswerOptions(
    libraryQuestion.answer_options as QuestionAnswerOption[] | null,
  );

  const { data: inserted, error: insertError } = await supabase
    .from("screener_questions")
    .insert({
      screener_id: screenerId,
      position,
      parent_id: null,
      sub_position: null,
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

  if (insertError) {
    const hint = schemaHint(insertError.message);
    throw new Error(hint ?? insertError.message);
  }

  return mapScreenerQuestion(inserted as DbScreenerQuestionRow);
}

export async function applyConsentBuilderToScreener(input: {
  screenerId: string;
  selectedLibraryQuestionIds: string[];
}): Promise<
  | { ok: true; questions: ScreenerQuestion[]; addedCount: number; removedCount: number }
  | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    await getScreenerById(input.screenerId);

    const selectedIds = input.selectedLibraryQuestionIds.map((id) => {
      assertUuid(id, "library question id");
      return id;
    });
    const selectedSet = new Set(selectedIds);
    const uniqueSelected = Array.from(selectedSet);
    if (uniqueSelected.length !== selectedIds.length) {
      return { ok: false, error: "Duplicate library questions in selection." };
    }

    const supabase = createAdminClient();
    const { data: libraryRows, error: libraryError } = await supabase
      .from("question_library")
      .select("id, category, tags")
      .eq("status", "approved");

    if (libraryError) return { ok: false, error: libraryError.message };

    const consentPoolIds = new Set(
      (libraryRows ?? [])
        .filter((row) =>
          isConsentBuilderCategoryAndTags(
            row.category as QuestionLibraryCategory,
            row.tags as string[] | null,
          ),
        )
        .map((row) => row.id as string),
    );

    for (const id of uniqueSelected) {
      if (!consentPoolIds.has(id)) {
        return {
          ok: false,
          error: "One or more selected questions are not part of the consent builder.",
        };
      }
    }

    const currentQuestions = await fetchScreenerQuestionsOrdered(input.screenerId);
    const byLibraryId = new Map<string, ScreenerQuestion>();
    for (const question of currentQuestions) {
      if (question.libraryQuestionId) {
        byLibraryId.set(question.libraryQuestionId, question);
      }
    }

    const toRemove = currentQuestions.filter(
      (q) =>
        q.libraryQuestionId &&
        consentPoolIds.has(q.libraryQuestionId) &&
        !selectedSet.has(q.libraryQuestionId) &&
        q.parentId === null,
    );

    let removedCount = 0;
    for (const question of toRemove) {
      const subCount = currentQuestions.filter(
        (q) => q.parentId === question.id,
      ).length;
      const res =
        subCount > 0
          ? await deleteScreenerQuestionWithChildren({
              screenerId: input.screenerId,
              questionId: question.id,
            })
          : await deleteScreenerQuestion({
              screenerId: input.screenerId,
              questionId: question.id,
            });
      if (!res.ok) return { ok: false, error: res.error };
      removedCount += 1;
    }

    const orderedToAdd = selectedIds.filter((id) => !byLibraryId.has(id));
    let addedCount = 0;
    const tempBase = 50_000;

    for (let index = 0; index < orderedToAdd.length; index++) {
      await insertLibraryQuestionAtPosition(
        input.screenerId,
        orderedToAdd[index],
        tempBase + index,
      );
      addedCount += 1;
    }

    const refreshed = await fetchScreenerQuestionsOrdered(input.screenerId);
    const refreshedByLibraryId = new Map<string, ScreenerQuestion>();
    for (const question of refreshed) {
      if (question.libraryQuestionId) {
        refreshedByLibraryId.set(question.libraryQuestionId, question);
      }
    }

    const consentBlockIds: string[] = [];
    for (const libraryId of selectedIds) {
      const question = refreshedByLibraryId.get(libraryId);
      if (question?.parentId === null) {
        consentBlockIds.push(question.id);
      }
    }

    const consentBlockSet = new Set(consentBlockIds);
    const topLevelOrdered = refreshed
      .filter((q) => q.parentId === null)
      .sort((a, b) => a.position - b.position)
      .map((q) => q.id);

    const restIds = topLevelOrdered.filter((id) => !consentBlockSet.has(id));
    const finalOrder = [...consentBlockIds, ...restIds];

    if (finalOrder.length > 0) {
      const questions = await applyTopLevelQuestionOrder(
        input.screenerId,
        finalOrder,
      );
      revalidatePath(editorPath(input.screenerId));
      return { ok: true, questions, addedCount, removedCount };
    }

    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions: refreshed, addedCount, removedCount };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not apply consent builder selection.",
    };
  }
}

export async function addManualScreenerQuestion(
  input: { screenerId: string; parentId?: string | null } & ManualQuestionPayload,
): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  return insertScreenerQuestionWithSource(input, "manual");
}

export async function addAiDraftScreenerQuestion(
  input: { screenerId: string; parentId?: string | null } & ManualQuestionPayload,
): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  return insertScreenerQuestionWithSource(input, "ai_draft");
}

async function insertScreenerQuestionWithSource(
  input: { screenerId: string; parentId?: string | null } & ManualQuestionPayload,
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

    let position: number;
    let parentId: string | null = null;
    let subPosition: number | null = null;

    if (input.parentId) {
      assertUuid(input.parentId, "parent id");
      const parentCheck = await validateParentQuestion(
        input.screenerId,
        input.parentId,
      );
      if (!parentCheck.ok) return parentCheck;
      parentId = input.parentId;
      position = parentCheck.position;
      subPosition = await nextSubQuestionPosition(input.screenerId, parentId);
    } else {
      position = await nextTopLevelQuestionPosition(input.screenerId);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("screener_questions")
      .insert({
        screener_id: input.screenerId,
        position,
        parent_id: parentId,
        sub_position: subPosition,
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

    if (insertError) {
      const hint = schemaHint(insertError.message);
      return { ok: false, error: hint ?? insertError.message };
    }

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

/** Quick wording tweak from stakeholder review (text only). */
export async function updateScreenerQuestionTextQuick(input: {
  screenerId: string;
  questionId: string;
  questionText: string;
}): Promise<
  { ok: true; question: ScreenerQuestion } | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    assertUuid(input.questionId, "question id");
    await getScreenerById(input.screenerId);

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

    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("screener_questions")
      .select(SCREENER_QUESTION_SELECT)
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) {
      const hint = schemaHint(fetchError.message);
      return { ok: false, error: hint ?? fetchError.message };
    }
    if (!existing) return { ok: false, error: "Question not found." };

    const { data: updated, error: updateError } = await supabase
      .from("screener_questions")
      .update({
        question_text: questionText,
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
    revalidatePath(
      `/workspace/screener-studio/${input.screenerId}/stakeholder-review`,
    );

    return {
      ok: true,
      question: mapScreenerQuestion(updated as DbScreenerQuestionRow),
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not update question text.",
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
  return reorderTopLevelScreenerQuestions(input);
}

export async function reorderTopLevelScreenerQuestions(input: {
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
      .eq("screener_id", input.screenerId)
      .is("parent_id", null);

    if (fetchError) return { ok: false, error: fetchError.message };

    const existingIds = (existing ?? []).map((row) => row.id as string);
    if (existingIds.length !== orderedQuestionIds.length) {
      return {
        ok: false,
        error: "Reorder list must include every top-level question.",
      };
    }

    const existingSet = new Set(existingIds);
    for (const id of orderedQuestionIds) {
      if (!existingSet.has(id)) {
        return {
          ok: false,
          error: "One or more questions do not belong to this screener.",
        };
      }
    }

    const questions = await applyTopLevelQuestionOrder(
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

export async function reorderSubScreenerQuestions(input: {
  screenerId: string;
  parentId: string;
  orderedSubQuestionIds: string[];
}): Promise<
  | { ok: true; questions: ScreenerQuestion[] }
  | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    assertUuid(input.parentId, "parent id");
    await getScreenerById(input.screenerId);

    const parentCheck = await validateParentQuestion(
      input.screenerId,
      input.parentId,
    );
    if (!parentCheck.ok) return parentCheck;

    const orderedSubQuestionIds = input.orderedSubQuestionIds.map((id) => {
      assertUuid(id, "question id");
      return id;
    });

    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("screener_questions")
      .select("id")
      .eq("screener_id", input.screenerId)
      .eq("parent_id", input.parentId);

    if (fetchError) return { ok: false, error: fetchError.message };

    const existingIds = (existing ?? []).map((row) => row.id as string);
    if (existingIds.length !== orderedSubQuestionIds.length) {
      return {
        ok: false,
        error: "Reorder list must include every sub-question for this parent.",
      };
    }

    const existingSet = new Set(existingIds);
    for (const id of orderedSubQuestionIds) {
      if (!existingSet.has(id)) {
        return {
          ok: false,
          error: "One or more sub-questions do not belong to this parent.",
        };
      }
    }

    const questions = await applySubQuestionOrder(
      input.screenerId,
      input.parentId,
      orderedSubQuestionIds,
    );

    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not reorder sub-questions.",
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
      .select("id, is_locked, parent_id")
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };
    if (!question) return { ok: false, error: "Question not found." };
    if (question.is_locked) {
      const removable = await screenerQuestionMayDeleteDespiteLock(
        supabase,
        input.screenerId,
        input.questionId,
      );
      if (!removable) {
        return { ok: false, error: "Locked questions cannot be deleted." };
      }
    }

    const { error } = await supabase
      .from("screener_questions")
      .delete()
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (error) return { ok: false, error: error.message };

    let questions: ScreenerQuestion[];

    if (question.parent_id) {
      const parentId = question.parent_id as string;
      const { data: remainingSubs, error: subsError } = await supabase
        .from("screener_questions")
        .select("id")
        .eq("screener_id", input.screenerId)
        .eq("parent_id", parentId)
        .order("sub_position", { ascending: true });

      if (subsError) return { ok: false, error: subsError.message };

      const remainingIds = (remainingSubs ?? []).map((row) => row.id as string);
      questions =
        remainingIds.length > 0
          ? await applySubQuestionOrder(
              input.screenerId,
              parentId,
              remainingIds,
            )
          : await fetchScreenerQuestionsOrdered(input.screenerId);
    } else {
      questions = await renumberTopLevelQuestions(input.screenerId);
    }

    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not delete question.",
    };
  }
}

export async function nestScreenerQuestionUnderParent(input: {
  screenerId: string;
  questionId: string;
  parentId: string;
}): Promise<
  | { ok: true; questions: ScreenerQuestion[] }
  | { ok: false; error: string }
> {
  try {
    assertUuid(input.screenerId, "screener id");
    assertUuid(input.questionId, "question id");
    assertUuid(input.parentId, "parent id");
    await getScreenerById(input.screenerId);

    if (input.questionId === input.parentId) {
      return { ok: false, error: "A question cannot be nested under itself." };
    }

    const supabase = createAdminClient();
    const { data: question, error: fetchError } = await supabase
      .from("screener_questions")
      .select("id, parent_id")
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };
    if (!question) return { ok: false, error: "Question not found." };

    const { count: childCount, error: childError } = await supabase
      .from("screener_questions")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (childError) return { ok: false, error: childError.message };
    if ((childCount ?? 0) > 0) {
      return {
        ok: false,
        error:
          "Questions with sub-questions cannot be nested under another question.",
      };
    }

    const parentCheck = await validateParentQuestion(
      input.screenerId,
      input.parentId,
    );
    if (!parentCheck.ok) return parentCheck;

    if (question.parent_id === input.parentId) {
      const questions = await fetchScreenerQuestionsOrdered(input.screenerId);
      return { ok: true, questions };
    }

    const oldParentId = question.parent_id as string | null;
    const subPosition = await nextSubQuestionPosition(
      input.screenerId,
      input.parentId,
    );

    const { error: updateError } = await supabase
      .from("screener_questions")
      .update({
        parent_id: input.parentId,
        position: parentCheck.position,
        sub_position: subPosition,
      })
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (updateError) return { ok: false, error: updateError.message };

    if (oldParentId) {
      const { data: remainingSubs, error: subsError } = await supabase
        .from("screener_questions")
        .select("id")
        .eq("screener_id", input.screenerId)
        .eq("parent_id", oldParentId)
        .order("sub_position", { ascending: true });

      if (subsError) return { ok: false, error: subsError.message };

      const remainingIds = (remainingSubs ?? []).map((row) => row.id as string);
      if (remainingIds.length > 0) {
        await applySubQuestionOrder(
          input.screenerId,
          oldParentId,
          remainingIds,
        );
      }
    } else {
      await renumberTopLevelQuestions(input.screenerId);
    }

    const questions = await fetchScreenerQuestionsOrdered(input.screenerId);
    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not nest question.",
    };
  }
}

export async function unnestScreenerQuestionToTopLevel(input: {
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
      .select("id, parent_id")
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };
    if (!question) return { ok: false, error: "Question not found." };
    if (!question.parent_id) {
      const questions = await fetchScreenerQuestionsOrdered(input.screenerId);
      return { ok: true, questions };
    }

    const oldParentId = question.parent_id as string;
    const newPosition = await nextTopLevelQuestionPosition(input.screenerId);

    const { error: updateError } = await supabase
      .from("screener_questions")
      .update({
        parent_id: null,
        sub_position: null,
        position: newPosition,
      })
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (updateError) return { ok: false, error: updateError.message };

    const { data: remainingSubs, error: subsError } = await supabase
      .from("screener_questions")
      .select("id")
      .eq("screener_id", input.screenerId)
      .eq("parent_id", oldParentId)
      .order("sub_position", { ascending: true });

    if (subsError) return { ok: false, error: subsError.message };

    const remainingIds = (remainingSubs ?? []).map((row) => row.id as string);
    if (remainingIds.length > 0) {
      await applySubQuestionOrder(input.screenerId, oldParentId, remainingIds);
    }

    const questions = await fetchScreenerQuestionsOrdered(input.screenerId);
    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not move question to top level.",
    };
  }
}

export async function deleteScreenerQuestionWithChildren(input: {
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
      .select("id, is_locked, parent_id")
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };
    if (!question) return { ok: false, error: "Question not found." };
    if (question.is_locked) {
      const removable = await screenerQuestionMayDeleteDespiteLock(
        supabase,
        input.screenerId,
        input.questionId,
      );
      if (!removable) {
        return { ok: false, error: "Locked questions cannot be deleted." };
      }
    }
    if (question.parent_id) {
      return deleteScreenerQuestion(input);
    }

    const { error: deleteChildrenError } = await supabase
      .from("screener_questions")
      .delete()
      .eq("parent_id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (deleteChildrenError) {
      return { ok: false, error: deleteChildrenError.message };
    }

    const { error: deleteParentError } = await supabase
      .from("screener_questions")
      .delete()
      .eq("id", input.questionId)
      .eq("screener_id", input.screenerId);

    if (deleteParentError) {
      return { ok: false, error: deleteParentError.message };
    }

    const questions = await renumberTopLevelQuestions(input.screenerId);

    revalidatePath(editorPath(input.screenerId));
    return { ok: true, questions };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not delete question.",
    };
  }
}
