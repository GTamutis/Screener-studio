"use server";

import { revalidatePath } from "next/cache";

import { getLibraryAdminForAction } from "@/lib/auth/require-library-admin";
import type { AdminFormCategory } from "@/lib/question-library/admin-constants";
import {
  formCategoryToDb,
  questionTypeShowsAnswerOptions,
} from "@/lib/question-library/admin-constants";
import type { AdminFormQuestionType } from "@/lib/question-library/admin-constants";
import type { AdminQuestionStatus } from "@/lib/question-library/admin-constants";
import type { AdminSectorOption } from "@/lib/question-library/admin-constants";
import { formSectorsToDb } from "@/lib/question-library/admin-constants";
import {
  mapAdminQuestionLibraryRow,
  type AdminQuestionLibraryItem,
  type QuestionAnswerOption,
  type QuestionLibraryRow,
} from "@/lib/question-library/types";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_PATH = "/dashboard/admin/question-library";

export type QuestionLibraryFormInput = {
  questionText: string;
  questionType: AdminFormQuestionType;
  answerOptionTexts: string[];
  category: AdminFormCategory;
  sectors: AdminSectorOption[];
  isLocked: boolean;
  status: AdminQuestionStatus;
  approvedBy: string | null;
};

function revalidateAdminLibrary() {
  revalidatePath(ADMIN_PATH);
  revalidatePath("/screener-studio/question-library");
}

function normalizeAnswerOptions(
  type: AdminFormQuestionType,
  texts: string[],
  existingOptions: QuestionAnswerOption[] = [],
): QuestionAnswerOption[] {
  if (!questionTypeShowsAnswerOptions(type)) return [];

  const existingByText = new Map<string, boolean[]>();
  for (const option of existingOptions) {
    const key = option.text.trim();
    const values = existingByText.get(key) ?? [];
    values.push(Boolean(option.terminate));
    existingByText.set(key, values);
  }

  return texts
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text, index) => {
      const matchingValues = existingByText.get(text);
      const preservedTerminate =
        matchingValues?.shift() ?? Boolean(existingOptions[index]?.terminate);
      return { text, terminate: preservedTerminate };
    });
}

function validateFormInput(
  input: QuestionLibraryFormInput,
): string | null {
  if (!input.questionText.trim()) return "Question text is required.";
  if (
    questionTypeShowsAnswerOptions(input.questionType) &&
    input.answerOptionTexts.every((t) => !t.trim())
  ) {
    return "Add at least one answer option for this question type.";
  }
  return null;
}

function buildApprovedFields(
  status: AdminQuestionStatus,
  approvedBy: string | null,
  existingApprovedAt: string | null,
) {
  const now = new Date().toISOString();
  if (status === "approved") {
    return {
      approved_by: approvedBy?.trim() || null,
      approved_at: existingApprovedAt ?? now,
    };
  }
  return {
    approved_by: approvedBy?.trim() || null,
    approved_at: null,
  };
}

export async function listAllLibraryQuestionsForAdmin(): Promise<
  AdminQuestionLibraryItem[] | { error: string }
> {
  const gate = await getLibraryAdminForAction();
  if ("error" in gate) return { error: gate.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("question_library")
    .select(
      "id, display_id, question_text, question_type, answer_options, category, tags, sector, methodology, is_locked, language, notes, status, approved_by, approved_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) return { error: error.message };

  return (data ?? []).map((row) =>
    mapAdminQuestionLibraryRow(row as QuestionLibraryRow),
  );
}

export async function createLibraryQuestion(
  input: QuestionLibraryFormInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const gate = await getLibraryAdminForAction();
  if ("error" in gate) return { ok: false, error: gate.error };

  const validationError = validateFormInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createAdminClient();
  const approved = buildApprovedFields(input.status, input.approvedBy, null);

  const { data, error } = await supabase
    .from("question_library")
    .insert({
      question_text: input.questionText.trim(),
      question_type: input.questionType,
      answer_options: normalizeAnswerOptions(
        input.questionType,
        input.answerOptionTexts,
      ),
      category: formCategoryToDb(input.category),
      sector: formSectorsToDb(input.sectors),
      is_locked: input.isLocked,
      status: input.status,
      language: "en",
      ...approved,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidateAdminLibrary();
  return { ok: true, id: data.id };
}

export async function updateLibraryQuestion(
  id: string,
  input: QuestionLibraryFormInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await getLibraryAdminForAction();
  if ("error" in gate) return { ok: false, error: gate.error };

  const validationError = validateFormInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("question_library")
    .select("approved_at, answer_options")
    .eq("id", id)
    .maybeSingle();

  if (findError) return { ok: false, error: findError.message };
  if (!existing) return { ok: false, error: "Question not found." };

  const approved = buildApprovedFields(
    input.status,
    input.approvedBy,
    existing.approved_at,
  );

  const { error } = await supabase
    .from("question_library")
    .update({
      question_text: input.questionText.trim(),
      question_type: input.questionType,
      answer_options: normalizeAnswerOptions(
        input.questionType,
        input.answerOptionTexts,
        Array.isArray(existing.answer_options)
          ? (existing.answer_options as QuestionAnswerOption[])
          : [],
      ),
      category: formCategoryToDb(input.category),
      sector: formSectorsToDb(input.sectors),
      is_locked: input.isLocked,
      status: input.status,
      ...approved,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidateAdminLibrary();
  return { ok: true };
}

export async function archiveLibraryQuestion(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await getLibraryAdminForAction();
  if ("error" in gate) return { ok: false, error: gate.error };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("question_library")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidateAdminLibrary();
  return { ok: true };
}
