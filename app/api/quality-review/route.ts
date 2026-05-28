import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { QUALITY_REVIEW_SYSTEM_PROMPT } from "@/lib/screeners/quality-review/constants";
import { parseQualityReviewResponse } from "@/lib/screeners/quality-review/parse-response";
import type { QualityReviewQuestionPayload } from "@/lib/screeners/quality-review/questions-payload";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

type QualityReviewRequestBody = {
  projectBrief?: unknown;
  questions?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function mapApiError(error: APIError): { message: string; status: number } {
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

function parseQuestions(
  questions: unknown,
): QualityReviewQuestionPayload[] | null {
  if (!Array.isArray(questions)) return null;

  for (const item of questions) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.position !== "number") {
      return null;
    }
    if (typeof row.questionText !== "string") return null;
  }

  return questions as QualityReviewQuestionPayload[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[api/quality-review] ANTHROPIC_API_KEY is not configured");
    return errorResponse("Quality review is not configured.", 500);
  }

  let body: QualityReviewRequestBody;
  try {
    body = (await req.json()) as QualityReviewRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const projectBrief =
    typeof body.projectBrief === "string" ? body.projectBrief.trim() : "";
  const questions = parseQuestions(body.questions);
  if (questions === null) {
    return errorResponse("questions must be a valid array.", 400);
  }

  const userContent = [
    "## Project brief",
    projectBrief || "(No project brief provided.)",
    "",
    "## Screener questions",
    JSON.stringify(questions, null, 2),
  ].join("\n");

  if (req.signal.aborted) {
    return errorResponse("Request aborted.", 499);
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: QUALITY_REVIEW_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      },
      { signal: req.signal },
    );

    if (req.signal.aborted) {
      return errorResponse("Request aborted.", 499);
    }

    const textBlock = message.content.find((block) => block.type === "text");
    const text =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    if (!text) {
      return errorResponse("Empty response from AI service.", 502);
    }

    const result = parseQualityReviewResponse(text);
    if (!result) {
      console.error("[api/quality-review] Failed to parse model JSON:", text);
      return errorResponse(
        "Could not parse quality review response. Please try again.",
        502,
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (
      req.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return errorResponse("Request aborted.", 499);
    }

    if (error instanceof APIError) {
      console.error(
        "[api/quality-review] Anthropic API error:",
        error.status,
        error.message,
      );
      const mapped = mapApiError(error);
      return errorResponse(mapped.message, mapped.status);
    }

    console.error("[api/quality-review] Unexpected error:", error);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
