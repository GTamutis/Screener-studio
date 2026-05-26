import type { OutreachAiChatMessage } from "@/lib/workspace/outreach-ai/types";

export type OutreachChatSession = {
  id: string;
  articleId: string;
  articleTitle: string;
  articleLink: string | null;
  articleSource: string | null;
  messages: OutreachAiChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type OutreachChatSessionSummary = {
  id: string;
  articleId: string;
  articleTitle: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DbOutreachChatSessionRow = {
  id: string;
  clerk_user_id: string;
  article_id: string;
  article_title: string;
  article_link: string | null;
  article_source: string | null;
  messages: unknown;
  created_at: string;
  updated_at: string;
};
