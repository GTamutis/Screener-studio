import type { ScreenerQuestion } from "@/lib/screeners/question-types";

export type QualityReviewQuestionPayload = {
  id: string;
  position: number;
  questionText: string;
  questionType: string | null;
  source: string;
  notes: string | null;
  answerOptions: {
    text: string;
    terminate?: boolean;
    logicNote?: string;
  }[];
};

export function serializeQuestionsForQualityReview(
  questions: ScreenerQuestion[],
): QualityReviewQuestionPayload[] {
  return [...questions]
    .sort((a, b) => a.position - b.position)
    .map((q, index) => ({
      id: q.id,
      position: index + 1,
      questionText: q.questionText,
      questionType: q.questionType,
      source: q.source,
      notes: q.notes,
      answerOptions: q.answerOptions.map((o) => ({
        text: o.text,
        ...(o.terminate ? { terminate: true } : {}),
        ...(o.logicNote?.trim() ? { logicNote: o.logicNote.trim() } : {}),
      })),
    }));
}
