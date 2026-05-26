import type { OutreachAiChatMessage } from "@/lib/workspace/outreach-ai/types";

const PREVIEW_MAX = 72;

export function parseOutreachChatMessages(raw: unknown): OutreachAiChatMessage[] {
  if (!Array.isArray(raw)) return [];

  const messages: OutreachAiChatMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { id, role, content } = item as {
      id?: unknown;
      role?: unknown;
      content?: unknown;
    };
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || !content.trim()) continue;
    messages.push({
      id: typeof id === "string" && id.trim() ? id : crypto.randomUUID(),
      role,
      content: content.trim(),
    });
  }
  return messages;
}

export function outreachSessionPreview(
  messages: OutreachAiChatMessage[],
  updatedAt: string,
): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    const text = firstUser.content.replace(/\s+/g, " ").trim();
    if (text.length <= PREVIEW_MAX) return text;
    return `${text.slice(0, PREVIEW_MAX - 1)}…`;
  }

  return `Chat from ${new Date(updatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}
