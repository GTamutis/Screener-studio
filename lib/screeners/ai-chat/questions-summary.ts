import type { ScreenerQuestion } from "@/lib/screeners/question-types";

export type ScreenerQuestionSummary = {
  position: number;
  questionText: string;
  questionType: string | null;
  source: string;
  answerOptions: { text: string; terminate?: boolean }[];
};

export function summarizeScreenerQuestions(
  questions: ScreenerQuestion[],
): ScreenerQuestionSummary[] {
  return [...questions]
    .sort((a, b) => a.position - b.position)
    .map((q) => ({
      position: q.position,
      questionText: q.questionText,
      questionType: q.questionType,
      source: q.source,
      answerOptions: q.answerOptions.map((o) => ({
        text: o.text,
        ...(o.terminate ? { terminate: true } : {}),
      })),
    }));
}
