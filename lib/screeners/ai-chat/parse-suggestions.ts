import type { QuestionLibraryType } from "@/lib/question-library/types";
import type { QuestionAnswerOption } from "@/lib/question-library/types";
import { questionTypeHasOptions } from "@/lib/screeners/manual-question";

import type { AiSuggestedQuestion } from "./types";

const SUGGESTIONS_FENCE = /```screener-suggestions\s*([\s\S]*?)```/i;

const VALID_TYPES = new Set<QuestionLibraryType>([
  "single",
  "multi",
  "open",
  "numeric",
  "scale",
  "statement",
  "grid",
]);

function normalizeAnswerOptions(raw: unknown): QuestionAnswerOption[] {
  if (!Array.isArray(raw)) return [];

  const options: QuestionAnswerOption[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      options.push({ text: item.trim() });
      continue;
    }
    if (typeof item === "object" && item !== null) {
      const text =
        typeof (item as { text?: unknown }).text === "string"
          ? (item as { text: string }).text.trim()
          : typeof (item as { label?: unknown }).label === "string"
            ? (item as { label: string }).label.trim()
            : "";
      if (!text) continue;
      const terminate = Boolean((item as { terminate?: unknown }).terminate);
      const logicNote =
        typeof (item as { logicNote?: unknown }).logicNote === "string"
          ? (item as { logicNote: string }).logicNote.trim()
          : typeof (item as { logic_note?: unknown }).logic_note === "string"
            ? (item as { logic_note: string }).logic_note.trim()
            : "";
      options.push({
        text,
        ...(terminate ? { terminate: true } : {}),
        ...(logicNote ? { logicNote } : {}),
      });
    }
  }
  return options;
}

function parseSuggestionItem(
  raw: unknown,
  index: number,
): AiSuggestedQuestion | null {
  if (typeof raw !== "object" || raw === null) return null;

  const row = raw as Record<string, unknown>;
  const questionText =
    typeof row.questionText === "string"
      ? row.questionText.trim()
      : typeof row.text === "string"
        ? row.text.trim()
        : "";

  if (!questionText) return null;

  const typeRaw =
    typeof row.questionType === "string"
      ? row.questionType
      : typeof row.type === "string"
        ? row.type
        : "single";

  const questionType = VALID_TYPES.has(typeRaw as QuestionLibraryType)
    ? (typeRaw as QuestionLibraryType)
    : "single";

  let answerOptions = normalizeAnswerOptions(
    row.answerOptions ?? row.options,
  );

  if (!questionTypeHasOptions(questionType)) {
    answerOptions = [];
  }

  return {
    id: `suggestion-${index}-${questionText.slice(0, 24)}`,
    questionText,
    questionType,
    answerOptions,
  };
}

export function parseSuggestedQuestions(
  content: string,
): AiSuggestedQuestion[] {
  const match = content.match(SUGGESTIONS_FENCE);
  if (!match?.[1]) return [];

  try {
    const parsed = JSON.parse(match[1].trim()) as unknown;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const suggestions: AiSuggestedQuestion[] = [];

    items.forEach((item, index) => {
      const suggestion = parseSuggestionItem(item, index);
      if (suggestion) suggestions.push(suggestion);
    });

    return suggestions;
  } catch {
    return [];
  }
}

/** Remove the suggestions fence so chat UI shows only the prose reply. */
export function stripSuggestionsBlock(content: string): string {
  return content.replace(SUGGESTIONS_FENCE, "").trimEnd();
}
