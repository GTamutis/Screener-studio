import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { StakeholderReviewPersona } from "@/lib/screeners/stakeholder-review/constants";
import type {
  StakeholderReviewInsertRow,
  StakeholderReviewModelResponse,
} from "@/lib/screeners/stakeholder-review/types";

/** Top-level question id for a given screener position (sub-questions share position). */
export function questionIdForPosition(
  questions: ScreenerQuestion[],
  position: number,
): string | null {
  const topLevel = questions.find(
    (q) => q.parentId === null && q.position === position,
  );
  if (topLevel) return topLevel.id;

  const any = questions.find((q) => q.position === position);
  return any?.id ?? null;
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
