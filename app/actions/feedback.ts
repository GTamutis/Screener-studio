"use server";

import { getActiveAppUserForAction, getAdminAppUserForAction } from "@/lib/auth/get-app-user";
import { sendFeedbackNotification } from "@/lib/email/send-feedback-notification";
import { normalizeWhitespace } from "@/lib/invitely/validation";
import {
  mapWorkspaceFeedbackRow,
  type DbWorkspaceFeedbackRow,
  type WorkspaceFeedbackEntry,
  type WorkspaceFeedbackKind,
} from "@/lib/workspace/feedback/types";
import { createAdminClient } from "@/lib/supabase/admin";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const PAGE_URL_MAX = 500;

const FEEDBACK_SELECT =
  "id, kind, message, page_url, clerk_user_id, user_email, user_display_name, created_at";

function feedbackSchemaHint(errorMessage: string): string | null {
  if (
    /workspace_feedback/i.test(errorMessage) &&
    /column|schema cache|relation|type/i.test(errorMessage)
  ) {
    return "Database schema is out of date. Run migration 018_workspace_feedback.sql in the Supabase SQL editor, then try again.";
  }
  return null;
}

function normalizePageUrl(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.length > PAGE_URL_MAX) {
    throw new Error(`Page URL must be ${PAGE_URL_MAX} characters or fewer.`);
  }
  return trimmed;
}

export async function submitWorkspaceFeedback(input: {
  kind: WorkspaceFeedbackKind;
  message: string;
  pageUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const appUser = await getActiveAppUserForAction();
    if ("error" in appUser) return { ok: false, error: appUser.error };

    if (input.kind !== "bug" && input.kind !== "suggestion") {
      return { ok: false, error: "Invalid feedback type." };
    }

    const message = normalizeWhitespace(input.message);
    if (message.length < MESSAGE_MIN) {
      return {
        ok: false,
        error: `Please add at least ${MESSAGE_MIN} characters of detail.`,
      };
    }
    if (message.length > MESSAGE_MAX) {
      return {
        ok: false,
        error: `Message must be ${MESSAGE_MAX} characters or fewer.`,
      };
    }

    let pageUrl: string | null;
    try {
      pageUrl = normalizePageUrl(input.pageUrl);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Invalid page URL.",
      };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspace_feedback")
      .insert({
        kind: input.kind,
        message,
        page_url: pageUrl,
        clerk_user_id: appUser.clerkUserId!,
        user_email: appUser.email,
        user_display_name: appUser.displayName,
      })
      .select(FEEDBACK_SELECT)
      .single();

    if (error) {
      return {
        ok: false,
        error: feedbackSchemaHint(error.message) ?? error.message,
      };
    }

    const entry = mapWorkspaceFeedbackRow(data as DbWorkspaceFeedbackRow);
    await sendFeedbackNotification({
      id: entry.id,
      kind: entry.kind,
      message: entry.message,
      pageUrl: entry.pageUrl,
      userEmail: entry.userEmail,
      userDisplayName: entry.userDisplayName,
    });

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not submit feedback.",
    };
  }
}

export async function listWorkspaceFeedback(): Promise<
  WorkspaceFeedbackEntry[] | { error: string }
> {
  try {
    const appUser = await getAdminAppUserForAction();
    if ("error" in appUser) return { error: appUser.error };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspace_feedback")
      .select(FEEDBACK_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return {
        error: feedbackSchemaHint(error.message) ?? error.message,
      };
    }

    return (data ?? []).map((row) =>
      mapWorkspaceFeedbackRow(row as DbWorkspaceFeedbackRow),
    );
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not load feedback.",
    };
  }
}
