import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { buildQuestionTree, flattenQuestionTree } from "@/lib/screeners/question-tree";
import type { StakeholderReviewPersona } from "@/lib/screeners/stakeholder-review/constants";
import type {
  StakeholderReviewInsertRow,
  StakeholderReviewModelResponse,
} from "@/lib/screeners/stakeholder-review/types";

/** Question id for the 1-indexed review_position shown to the model. */
export function questionIdForPosition(
  questions: ScreenerQuestion[],
  position: number,
): string | null {
  const flat = flattenQuestionTree(buildQuestionTree(questions));
  return flat[position - 1]?.question.id ?? null;
}

export function modelResponseToInsertRows(
  screenerId: string,
  questions: ScreenerQuestion[],
  parsed: StakeholderReviewModelResponse,
): StakeholderReviewInsertRow[] {
  const rows: StakeholderReviewInsertRow[] = [];

  for (const persona of Object.keys(parsed) as StakeholderReviewPersona[]) {
    for (const item of parsed[persona]) {
      let question_id: string | null = null;
      if (item.question_position !== null) {
        question_id = questionIdForPosition(questions, item.question_position);
        if (!question_id) continue;
      }

      rows.push({
        screener_id: screenerId,
        persona,
        question_id,
        severity: item.severity,
        feedback_text: item.feedback_text,
      });
    }
  }

  return rows;
}
