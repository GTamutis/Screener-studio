"use server";

import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import {
  mapQuestionLibraryRow,
  type QuestionLibraryItem,
  type QuestionLibraryRow,
} from "@/lib/question-library/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listApprovedLibraryQuestions(): Promise<
  QuestionLibraryItem[] | { error: string }
> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return { error: appUser.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("question_library")
    .select(
      "id, display_id, question_text, question_type, answer_options, category, tags, is_locked, language, notes",
    )
    .eq("status", "approved")
    .order("display_id", { ascending: true, nullsFirst: false });

  if (error) return { error: error.message };

  return (data ?? []).map((row) =>
    mapQuestionLibraryRow(row as QuestionLibraryRow),
  );
}
