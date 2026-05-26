import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

type ChatRequestBody = {
  messages?: unknown;
  systemPrompt?: unknown;
  projectBrief?: unknown;
  currentQuestions?: unknown;
};

function isMessageRole(role: unknown): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

function parseMessages(messages: unknown): MessageParam[] | null {
  if (!Array.isArray(messages)) return null;

  const parsed: MessageParam[] = [];
  for (const item of messages) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (!isMessageRole(role) || typeof content !== "string") return null;
    parsed.push({ role, content });
  }

  return parsed;
}

function buildSystem(
  systemPrompt: string,
  projectBrief: string,
  currentQuestions: unknown[],
): string | undefined {
  const parts: string[] = [];

  if (systemPrompt.trim()) parts.push(systemPrompt.trim());
  if (projectBrief.trim()) {
    parts.push(`## Project brief\n\n${projectBrief.trim()}`);
  }
  if (currentQuestions.length > 0) {
    parts.push(
      `## Current screener questions\n\n${JSON.stringify(currentQuestions, null, 2)}`,
    );
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function mapApiError(error: APIError): { message: string; status: number } {
  const status = typeof error.status === "number" ? error.status : 502;
  if (status === 401) {
    return { message: "AI service authentication failed.", status: 500 };
  }
  if (status === 429) {
    return { message: "AI service is busy. Please try again shortly.", status: 429 };
  }
  if (status >= 400 && status < 500) {
    return { message: "Invalid request to AI service.", status: 400 };
  }
  return { message: "AI service error. Please try again.", status: 502 };
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[api/chat] ANTHROPIC_API_KEY is not configured");
    return errorResponse("Chat is not configured.", 500);
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const messages = parseMessages(body.messages);
  if (messages === null) {
    return errorResponse(
      "messages must be an array of { role: \"user\" | \"assistant\", content: string }.",
      400,
    );
  }
  if (messages.length === 0) {
    return errorResponse("messages must include at least one message.", 400);
  }

  const systemPrompt =
    typeof body.systemPrompt === "string" ? body.systemPrompt : "";
  const projectBrief =
    typeof body.projectBrief === "string" ? body.projectBrief : "";
  const currentQuestions = Array.isArray(body.currentQuestions)
    ? body.currentQuestions
    : [];

  const system = buildSystem(systemPrompt, projectBrief, currentQuestions);
  const anthropic = new Anthropic({ apiKey });

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      ...(system ? { system } : {}),
      messages,
    });

    if (req.signal.aborted) {
      stream.abort();
      return errorResponse("Request aborted.", 499);
    }

    req.signal.addEventListener("abort", () => {
      stream.abort();
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.error("[api/chat] Anthropic API error:", error.status, error.message);
      const mapped = mapApiError(error);
      return errorResponse(mapped.message, mapped.status);
    }

    console.error("[api/chat] Unexpected error:", error);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
