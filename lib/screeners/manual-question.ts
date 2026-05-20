import type { QuestionAnswerOption } from "@/lib/question-library/types";
import type { QuestionLibraryType } from "@/lib/question-library/types";
import { QUESTION_TYPE_LABELS } from "@/lib/question-library/constants";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";

export type ManualScreenerQuestionType = QuestionLibraryType;

export const MANUAL_QUESTION_TYPE_OPTIONS = (
  Object.keys(QUESTION_TYPE_LABELS) as QuestionLibraryType[]
).map((value) => ({
  value,
  label: QUESTION_TYPE_LABELS[value] ?? value,
}));

export type QuestionOptionFormRow = {
  text: string;
  terminate: boolean;
};

export function questionTypeHasOptions(
  type: QuestionLibraryType | null | undefined,
): boolean {
  return type === "single" || type === "multi";
}

export function normalizeManualAnswerOptions(
  options: QuestionOptionFormRow[],
): QuestionAnswerOption[] {
  return options
    .map((row) => ({
      text: row.text.trim(),
      ...(row.terminate ? { terminate: true } : {}),
    }))
    .filter((opt) => opt.text.length > 0);
}

/** Keep terminate flags from library options when the user edits option text. */
export function mergeAnswerOptionsPreservingMetadata(
  optionRows: QuestionOptionFormRow[],
  previous: QuestionAnswerOption[],
): QuestionAnswerOption[] {
  const normalized = normalizeManualAnswerOptions(optionRows);

  return normalized.map((opt, index) => {
    const row = optionRows.filter((r) => r.text.trim()).at(index);
    if (row?.terminate) {
      return { ...opt, terminate: true };
    }
    const prevByIndex = previous[index];
    if (prevByIndex?.text.trim() === opt.text && prevByIndex.terminate) {
      return { ...opt, terminate: true };
    }
    const prevByText = previous.find((p) => p.text.trim() === opt.text);
    if (prevByText?.terminate) {
      return { ...opt, terminate: true };
    }
    return opt;
  });
}

export function toQuestionLibraryType(
  type: string | null | undefined,
): QuestionLibraryType {
  const match = MANUAL_QUESTION_TYPE_OPTIONS.find((o) => o.value === type);
  return match?.value ?? "single";
}

export function screenerQuestionToFormState(question: ScreenerQuestion): {
  questionText: string;
  questionType: QuestionLibraryType;
  notes: string;
  answerOptions: QuestionOptionFormRow[];
} {
  const optionRows =
    question.answerOptions.length > 0
      ? question.answerOptions.map((o) => ({
          text: o.text,
          terminate: Boolean(o.terminate),
        }))
      : [
          { text: "", terminate: false },
          { text: "", terminate: false },
        ];

  return {
    questionText: question.questionText,
    questionType: toQuestionLibraryType(question.questionType),
    notes: question.notes ?? "",
    answerOptions: optionRows,
  };
}

export function cloneAnswerOptions(
  options: QuestionAnswerOption[] | null | undefined,
): QuestionAnswerOption[] {
  if (!options || !Array.isArray(options)) return [];
  return JSON.parse(JSON.stringify(options)) as QuestionAnswerOption[];
}
