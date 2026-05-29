import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import {
  computeQuestionLabels,
  sortScreenerQuestions,
} from "@/lib/screeners/question-tree";

export type QualityReviewQuestionPayload = {
  id: string;
  position: number;
  label: string;
  parentId: string | null;
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
  const labels = computeQuestionLabels(questions);

  return sortScreenerQuestions(questions).map((q) => ({
    id: q.id,
    position: q.position,
    label: labels.get(q.id) ?? `Q${q.position}`,
    parentId: q.parentId,
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
