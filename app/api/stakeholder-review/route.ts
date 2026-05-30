import { APIError } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import {
  mapAnthropicApiError,
  runStakeholderReview,
} from "@/lib/screeners/stakeholder-review/run-review";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StakeholderReviewRequestBody = {
  screenerId?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[api/stakeholder-review] ANTHROPIC_API_KEY is not configured");
    return errorResponse("Stakeholder review is not configured.", 500);
  }

  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) {
    return errorResponse(
      appUser.error,
      appUser.error === "Sign in required." ? 401 : 403,
    );
  }

  let body: StakeholderReviewRequestBody;
  try {
    body = (await req.json()) as StakeholderReviewRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const screenerId =
    typeof body.screenerId === "string" ? body.screenerId.trim() : "";
  if (!UUID_RE.test(screenerId)) {
    return errorResponse("A valid screenerId is required.", 400);
  }

  if (req.signal.aborted) {
    return errorResponse("Request aborted.", 499);
  }

  const supabase = createAdminClient();
  const { data: screenerRow, error: screenerError } = await supabase
    .from("screeners")
    .select("id, project_id, stakeholder_review_status")
    .eq("id", screenerId)
    .maybeSingle();

  if (screenerError) {
    console.error("[api/stakeholder-review] Screener lookup failed:", screenerError);
    return errorResponse("Could not load screener.", 500);
  }
  if (!screenerRow) {
    return errorResponse("Screener not found.", 404);
  }

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("clerk_user_id")
    .eq("id", screenerRow.project_id as string)
    .maybeSingle();

  if (projectError) {
    console.error("[api/stakeholder-review] Project lookup failed:", projectError);
    return errorResponse("Could not load project.", 500);
  }
  if (!projectRow) {
    return errorResponse("Screener not found.", 404);
  }

  const ownerClerkId = projectRow.clerk_user_id as string;
  if (
    appUser.role !== "admin" &&
    appUser.clerkUserId !== ownerClerkId
  ) {
    return errorResponse("Screener not found.", 404);
  }

  if (screenerRow.stakeholder_review_status === "running") {
    return errorResponse(
      "A stakeholder review is already running for this screener.",
      409,
    );
  }

  try {
    const { total_issues } = await runStakeholderReview(screenerId, {
      apiKey,
      signal: req.signal,
    });

    if (req.signal.aborted) {
      return errorResponse("Request aborted.", 499);
    }

    return NextResponse.json({
      status: "complete",
      summary: { total_issues },
    });
  } catch (error) {
    if (
      req.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return errorResponse("Request aborted.", 499);
    }

    if (error instanceof APIError) {
      console.error(
        "[api/stakeholder-review] Anthropic API error:",
        error.status,
        error.message,
      );
      const mapped = mapAnthropicApiError(error);
      return errorResponse(mapped.message, mapped.status);
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    const status = /not found/i.test(message)
      ? 404
      : /parse|empty response/i.test(message)
        ? 502
        : 500;

    console.error("[api/stakeholder-review] Run failed:", error);
    return errorResponse(message, status);
  }
}
