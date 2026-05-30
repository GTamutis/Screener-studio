"use server";

import { revalidatePath } from "next/cache";

import { getProject } from "@/app/actions/projects";
import { getScreener } from "@/app/actions/screeners";
import { canAccessOwnedResource } from "@/lib/auth/access";
import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import type { StakeholderReviewPersona } from "@/lib/screeners/stakeholder-review/constants";
import {
  mapScreenerQuestion,
  SCREENER_QUESTION_SELECT,
  type DbScreenerQuestionRow,
} from "@/lib/screeners/question-types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { sortScreenerQuestions } from "@/lib/screeners/question-tree";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StakeholderReviewStatus =
  | "running"
  | "complete"
  | "failed"
  | null;

export type StakeholderReviewRecord = {
  id: string;
  screenerId: string;
  persona: StakeholderReviewPersona;
  questionId: string | null;
  severity: "amber" | "red";
  feedbackText: string;
  userDecision: "implemented" | "dismissed" | null;
  userDecisionNote: string | null;
  createdAt: string;
};

export type StakeholderReviewPageData = {
  screenerId: string;
  screenerName: string;
  projectId: string;
  projectName: string;
  clientName: string;
  reviewStatus: StakeholderReviewStatus;
  lastReviewedAt: string | null;
  questions: ScreenerQuestion[];
  reviews: StakeholderReviewRecord[];
};

function assertUuid(id: string, label = "id") {
  if (!UUID_RE.test(id)) throw new Error(`Invalid ${label}.`);
}

function stakeholderSchemaHint(message: string): string | null {
  if (
    /stakeholder_review|stakeholder_reviews/i.test(message) &&
    /column|schema cache|relation/i.test(message)
  ) {
    return "Database schema is out of date. Run migration 022_stakeholder_reviews.sql, then try again.";
  }
  return null;
}

function mapReviewRow(row: Record<string, unknown>): StakeholderReviewRecord {
  return {
    id: row.id as string,
    screenerId: row.screener_id as string,
    persona: row.persona as StakeholderReviewPersona,
    questionId: (row.question_id as string | null) ?? null,
    severity: row.severity as "amber" | "red",
    feedbackText: row.feedback_text as string,
    userDecision:
      row.user_decision === "implemented" || row.user_decision === "dismissed"
        ? row.user_decision
        : null,
    userDecisionNote: (row.user_decision_note as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

async function assertScreenerProjectAccess(
  projectId: string,
  screenerId: string,
): Promise<void> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) throw new Error(appUser.error);

  assertUuid(projectId, "project id");
  assertUuid(screenerId, "screener id");

  const project = await getProject(projectId);
  if (!canAccessOwnedResource(appUser, project.ownerClerkUserId)) {
    throw new Error("Screener not found.");
  }

  await getScreener(projectId, screenerId);
}

function revalidateStakeholderPaths(projectId: string, screenerId: string) {
  revalidatePath(
    `/workspace/screener-studio/${screenerId}/stakeholder-review`,
  );
  revalidatePath(`/workspace/screener-studio/${screenerId}`);
}

export async function getStakeholderReviewPageData(
  projectId: string,
  screenerId: string,
): Promise<StakeholderReviewPageData | { error: string }> {
  try {
    await assertScreenerProjectAccess(projectId, screenerId);

    const supabase = createAdminClient();
    const [screenerRes, questionsRes, reviewsRes] = await Promise.all([
      supabase
        .from("screeners")
        .select(
          "id, name, project_id, stakeholder_review_status, projects!inner(project_name, client_name)",
        )
        .eq("id", screenerId)
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("screener_questions")
        .select(SCREENER_QUESTION_SELECT)
        .eq("screener_id", screenerId)
        .order("position", { ascending: true })
        .order("sub_position", { ascending: true, nullsFirst: true }),
      supabase
        .from("stakeholder_reviews")
        .select(
          "id, screener_id, persona, question_id, severity, feedback_text, user_decision, user_decision_note, created_at",
        )
        .eq("screener_id", screenerId)
        .order("created_at", { ascending: true }),
    ]);

    if (screenerRes.error) {
      const hint = stakeholderSchemaHint(screenerRes.error.message);
      return { error: hint ?? screenerRes.error.message };
    }
    if (!screenerRes.data) return { error: "Screener not found." };

    if (questionsRes.error) {
      return { error: questionsRes.error.message };
    }
    if (reviewsRes.error) {
      const hint = stakeholderSchemaHint(reviewsRes.error.message);
      return { error: hint ?? reviewsRes.error.message };
    }

    const projectJoin = screenerRes.data.projects as
      | { project_name: string; client_name: string }
      | { project_name: string; client_name: string }[];
    const projectMeta = Array.isArray(projectJoin) ? projectJoin[0] : projectJoin;

    const reviews = (reviewsRes.data ?? []).map((row) =>
      mapReviewRow(row as Record<string, unknown>),
    );

    const lastReviewedAt =
      reviews.length > 0
        ? reviews.reduce((latest, row) =>
            row.createdAt > latest ? row.createdAt : latest,
          reviews[0].createdAt)
        : null;

    return {
      screenerId,
      screenerName: screenerRes.data.name as string,
      projectId,
      projectName: projectMeta?.project_name ?? "Project",
      clientName: projectMeta?.client_name ?? "",
      reviewStatus: (screenerRes.data.stakeholder_review_status ??
        null) as StakeholderReviewStatus,
      lastReviewedAt,
      questions: sortScreenerQuestions(
        (questionsRes.data ?? []).map((row) =>
          mapScreenerQuestion(row as DbScreenerQuestionRow),
        ),
      ),
      reviews,
    };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Could not load stakeholder review.",
    };
  }
}

export async function getStakeholderReviewPollState(
  projectId: string,
  screenerId: string,
): Promise<
  | {
      reviewStatus: StakeholderReviewStatus;
      lastReviewedAt: string | null;
    }
  | { error: string }
> {
  try {
    await assertScreenerProjectAccess(projectId, screenerId);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .select("stakeholder_review_status")
      .eq("id", screenerId)
      .maybeSingle();

    if (error) {
      const hint = stakeholderSchemaHint(error.message);
      return { error: hint ?? error.message };
    }
    if (!data) return { error: "Screener not found." };

    const { data: reviews, error: reviewsError } = await supabase
      .from("stakeholder_reviews")
      .select("created_at")
      .eq("screener_id", screenerId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (reviewsError) {
      const hint = stakeholderSchemaHint(reviewsError.message);
      return { error: hint ?? reviewsError.message };
    }

    const lastReviewedAt =
      reviews?.[0]?.created_at != null
        ? (reviews[0].created_at as string)
        : null;

    return {
      reviewStatus: (data.stakeholder_review_status ??
        null) as StakeholderReviewStatus,
      lastReviewedAt,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not load review status.",
    };
  }
}

export async function updateStakeholderReviewDecision(input: {
  projectId: string;
  screenerId: string;
  reviewId: string;
  decision: "implemented" | "dismissed";
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertScreenerProjectAccess(input.projectId, input.screenerId);
    assertUuid(input.reviewId, "review id");

    const note =
      typeof input.note === "string" && input.note.trim()
        ? input.note.trim()
        : null;

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("stakeholder_reviews")
      .update({
        user_decision: input.decision,
        user_decision_note: note,
      })
      .eq("id", input.reviewId)
      .eq("screener_id", input.screenerId);

    if (error) {
      const hint = stakeholderSchemaHint(error.message);
      return { ok: false, error: hint ?? error.message };
    }

    revalidateStakeholderPaths(input.projectId, input.screenerId);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not update decision.",
    };
  }
}

export async function clearStakeholderReviewDecision(input: {
  projectId: string;
  screenerId: string;
  reviewId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertScreenerProjectAccess(input.projectId, input.screenerId);
    assertUuid(input.reviewId, "review id");

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("stakeholder_reviews")
      .update({
        user_decision: null,
        user_decision_note: null,
      })
      .eq("id", input.reviewId)
      .eq("screener_id", input.screenerId);

    if (error) {
      const hint = stakeholderSchemaHint(error.message);
      return { ok: false, error: hint ?? error.message };
    }

    revalidateStakeholderPaths(input.projectId, input.screenerId);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not undo decision.",
    };
  }
}
