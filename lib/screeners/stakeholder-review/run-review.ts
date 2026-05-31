import "server-only";

import Anthropic, { APIError } from "@anthropic-ai/sdk";

import { getScreenerById } from "@/app/actions/screeners";
import { STAKEHOLDER_REVIEW_SYSTEM_PROMPT } from "@/lib/screeners/stakeholder-review/constants";
import { buildStakeholderReviewUserMessage } from "@/lib/screeners/stakeholder-review/build-prompt";
import { modelResponseToInsertRows } from "@/lib/screeners/stakeholder-review/map-feedback";
import { parseStakeholderReviewResponse } from "@/lib/screeners/stakeholder-review/parse-response";
import {
  mapScreenerQuestion,
  SCREENER_QUESTION_SELECT,
  type DbScreenerQuestionRow,
} from "@/lib/screeners/question-types";
import { sortScreenerQuestions } from "@/lib/screeners/question-tree";
import { createAdminClient } from "@/lib/supabase/admin";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16384;

export type StakeholderReviewRunResult = {
  total_issues: number;
};

function stakeholderStatusSchemaHint(message: string): string | null {
  if (
    /stakeholder_review_status/i.test(message) &&
    /column|schema cache/i.test(message)
  ) {
    return "Database schema is out of date. Run migration 022_stakeholder_reviews.sql in the Supabase SQL editor, then try again.";
  }
  return null;
}

async function setStakeholderReviewStatus(
  screenerId: string,
  status: "running" | "complete" | "failed" | null,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("screeners")
    .update({ stakeholder_review_status: status })
    .eq("id", screenerId);

  if (error) {
    const hint = stakeholderStatusSchemaHint(error.message);
    throw new Error(hint ?? error.message);
  }
}

async function fetchQuestionsForReview(screenerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("screener_questions")
    .select(SCREENER_QUESTION_SELECT)
    .eq("screener_id", screenerId)
    .order("position", { ascending: true })
    .order("sub_position", { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);

  return sortScreenerQuestions(
    (data ?? []).map((row) => mapScreenerQuestion(row as DbScreenerQuestionRow)),
  );
}

async function clearExistingReviews(
  screenerId: string,
  exceptReviewIds: string[] = [],
): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase
    .from("stakeholder_reviews")
    .delete()
    .eq("screener_id", screenerId);

  if (exceptReviewIds.length > 0) {
    query = query.not("id", "in", `(${exceptReviewIds.join(",")})`);
  }

  const { error } = await query;

  if (error) {
    const hint = stakeholderStatusSchemaHint(error.message);
    throw new Error(hint ?? error.message);
  }
}

async function insertReviews(
  rows: ReturnType<typeof modelResponseToInsertRows>,
): Promise<{ insertedIds: string[]; totalIssues: number }> {
  if (rows.length === 0) return { insertedIds: [], totalIssues: 0 };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stakeholder_reviews")
    .insert(rows)
    .select("id");

  if (error) {
    const hint = stakeholderStatusSchemaHint(error.message);
    throw new Error(hint ?? error.message);
  }

  const insertedIds = (data ?? [])
    .map((row) => (typeof row.id === "string" ? row.id : null))
    .filter((id): id is string => Boolean(id));

  if (insertedIds.length !== rows.length) {
    throw new Error("Could not confirm stakeholder review rows were saved.");
  }

  return { insertedIds, totalIssues: rows.length };
}

export async function runStakeholderReview(
  screenerId: string,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<StakeholderReviewRunResult> {
  const screener = await getScreenerById(screenerId);
  const questions = await fetchQuestionsForReview(screenerId);

  await setStakeholderReviewStatus(screenerId, "running");

  try {
    const anthropic = new Anthropic({ apiKey: options.apiKey });
    const message = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: STAKEHOLDER_REVIEW_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildStakeholderReviewUserMessage(screener, questions),
          },
        ],
      },
      { signal: options.signal },
    );

    const textBlock = message.content.find((block) => block.type === "text");
    const text =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    if (!text) {
      throw new Error("Empty response from AI service.");
    }

    const parsed = parseStakeholderReviewResponse(text);
    if (!parsed) {
      throw new Error("Could not parse stakeholder review response.");
    }

    const rows = modelResponseToInsertRows(screenerId, questions, parsed);
    const { insertedIds, totalIssues } = await insertReviews(rows);
    // Keep the previous successful review visible until replacement rows exist.
    await clearExistingReviews(screenerId, insertedIds);

    await setStakeholderReviewStatus(screenerId, "complete");
    return { total_issues: totalIssues };
  } catch (error) {
    await setStakeholderReviewStatus(screenerId, "failed").catch((statusError) => {
      console.error(
        "[stakeholder-review] Failed to set status to failed:",
        statusError,
      );
    });
    throw error;
  }
}

export function mapAnthropicApiError(error: APIError): {
  message: string;
  status: number;
} {
  const status = typeof error.status === "number" ? error.status : 502;
  if (status === 401) {
    return { message: "AI service authentication failed.", status: 500 };
  }
  if (status === 429) {
    return {
      message: "AI service is busy. Please try again shortly.",
      status: 429,
    };
  }
  if (status >= 400 && status < 500) {
    return { message: "Invalid request to AI service.", status: 400 };
  }
  return { message: "AI service error. Please try again.", status: 502 };
}
