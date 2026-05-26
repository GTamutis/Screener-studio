"use server";

import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";
import {
  outreachSessionPreview,
  parseOutreachChatMessages,
} from "@/lib/workspace/outreach-ai/session-preview";
import type {
  DbOutreachChatSessionRow,
  OutreachChatSession,
  OutreachChatSessionSummary,
} from "@/lib/workspace/outreach-ai/session-types";
import type { OutreachAiChatMessage } from "@/lib/workspace/outreach-ai/types";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SESSION_SELECT =
  "id, clerk_user_id, article_id, article_title, article_link, article_source, messages, created_at, updated_at";

function assertUuid(id: string) {
  if (!UUID_RE.test(id)) throw new Error("Invalid session id.");
}

function mapSession(row: DbOutreachChatSessionRow): OutreachChatSession {
  return {
    id: row.id,
    articleId: row.article_id,
    articleTitle: row.article_title,
    articleLink: row.article_link,
    articleSource: row.article_source,
    messages: parseOutreachChatMessages(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSessionSummary(
  row: DbOutreachChatSessionRow,
): OutreachChatSessionSummary {
  const messages = parseOutreachChatMessages(row.messages);
  return {
    id: row.id,
    articleId: row.article_id,
    articleTitle: row.article_title,
    preview: outreachSessionPreview(messages, row.updated_at),
    messageCount: messages.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function outreachSchemaHint(errorMessage: string): string | null {
  if (
    /outreach_chat_sessions/i.test(errorMessage) &&
    /column|schema cache|relation/i.test(errorMessage)
  ) {
    return "Database schema is out of date. Run migration 017_outreach_chat_sessions.sql in the Supabase SQL editor, then try again.";
  }
  return null;
}

export async function listOutreachChatSessions(
  articleId: string,
): Promise<OutreachChatSessionSummary[] | { error: string }> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return appUser;

  const trimmedArticleId = articleId.trim();
  if (!trimmedArticleId) return { error: "Article id is required." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("outreach_chat_sessions")
    .select(SESSION_SELECT)
    .eq("clerk_user_id", appUser.clerkUserId)
    .eq("article_id", trimmedArticleId)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[outreach-chats] list failed:", error.message);
    return {
      error: outreachSchemaHint(error.message) ?? "Could not load chat history.",
    };
  }

  return (data as DbOutreachChatSessionRow[]).map(mapSessionSummary);
}

export async function getOutreachChatSession(
  sessionId: string,
): Promise<OutreachChatSession | { error: string }> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return appUser;

  try {
    assertUuid(sessionId);
  } catch {
    return { error: "Invalid session id." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("outreach_chat_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .eq("clerk_user_id", appUser.clerkUserId)
    .maybeSingle();

  if (error) {
    console.error("[outreach-chats] get failed:", error.message);
    return {
      error: outreachSchemaHint(error.message) ?? "Could not load this chat.",
    };
  }

  if (!data) return { error: "Chat not found." };
  return mapSession(data as DbOutreachChatSessionRow);
}

export async function createOutreachChatSession(
  article: Pick<
    IndustryNewsItem,
    "id" | "title" | "link" | "source"
  >,
): Promise<{ sessionId: string } | { error: string }> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return appUser;

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("outreach_chat_sessions")
    .insert({
      clerk_user_id: appUser.clerkUserId,
      article_id: article.id,
      article_title: article.title,
      article_link: article.link,
      article_source: article.source,
      messages: [],
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[outreach-chats] create failed:", error.message);
    return {
      error:
        outreachSchemaHint(error.message) ?? "Could not start a new chat.",
    };
  }

  return { sessionId: data.id as string };
}

export async function saveOutreachChatSession(
  sessionId: string,
  messages: OutreachAiChatMessage[],
): Promise<{ ok: true } | { error: string }> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return appUser;

  try {
    assertUuid(sessionId);
  } catch {
    return { error: "Invalid session id." };
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("outreach_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("clerk_user_id", appUser.clerkUserId)
    .maybeSingle();

  if (fetchError) {
    console.error("[outreach-chats] save lookup failed:", fetchError.message);
    return {
      error:
        outreachSchemaHint(fetchError.message) ?? "Could not save this chat.",
    };
  }

  if (!existing) return { error: "Chat not found." };

  const { error } = await supabase
    .from("outreach_chat_sessions")
    .update({
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("clerk_user_id", appUser.clerkUserId);

  if (error) {
    console.error("[outreach-chats] save failed:", error.message);
    return {
      error: outreachSchemaHint(error.message) ?? "Could not save this chat.",
    };
  }

  return { ok: true };
}

export async function deleteOutreachChatSession(
  sessionId: string,
): Promise<{ ok: true } | { error: string }> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return appUser;

  try {
    assertUuid(sessionId);
  } catch {
    return { error: "Invalid session id." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("outreach_chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("clerk_user_id", appUser.clerkUserId);

  if (error) {
    console.error("[outreach-chats] delete failed:", error.message);
    return {
      error:
        outreachSchemaHint(error.message) ?? "Could not delete this chat.",
    };
  }

  return { ok: true };
}
