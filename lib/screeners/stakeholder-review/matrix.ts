import type { StakeholderReviewRecord } from "@/app/actions/stakeholder-reviews";
import {
  STAKEHOLDER_MATRIX_PERSONAS,
  type StakeholderReviewPersona,
} from "@/lib/screeners/stakeholder-review/constants";
import {
  cellSeverityRank,
  maxSeverity,
} from "@/lib/screeners/stakeholder-review/display";
import type { StakeholderReviewSeverity } from "@/lib/screeners/stakeholder-review/constants";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import {
  flattenQuestionTree,
  buildQuestionTree,
} from "@/lib/screeners/question-tree";

export type MatrixRow = {
  key: string;
  questionId: string | null;
  question: ScreenerQuestion | null;
  label: string;
  preview: string;
  isOverall: boolean;
};

export type MatrixCellData = {
  severity: StakeholderReviewSeverity;
  review: StakeholderReviewRecord | null;
};

export type PersonaIssueCounts = {
  red: number;
  amber: number;
};

function cellKey(questionId: string | null, persona: StakeholderReviewPersona) {
  return `${questionId ?? "__overall__"}:${persona}`;
}

export function buildMatrixRows(questions: ScreenerQuestion[]): MatrixRow[] {
  const flat = flattenQuestionTree(buildQuestionTree(questions));
  const rows: MatrixRow[] = flat.map((item) => ({
    key: item.question.id,
    questionId: item.question.id,
    question: item.question,
    label: item.label,
    preview: item.question.questionText,
    isOverall: false,
  }));

  rows.push({
    key: "__overall__",
    questionId: null,
    question: null,
    label: "Overall",
    preview: "Screener-wide feedback",
    isOverall: true,
  });

  return rows;
}

export function buildReviewLookup(
  reviews: StakeholderReviewRecord[],
): Map<string, StakeholderReviewRecord> {
  const map = new Map<string, StakeholderReviewRecord>();

  for (const review of reviews) {
    const key = cellKey(review.questionId, review.persona);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, review);
      continue;
    }
    if (
      cellSeverityRank(review.severity) >
      cellSeverityRank(existing.severity)
    ) {
      map.set(key, review);
    }
  }

  return map;
}

export function getMatrixCell(
  lookup: Map<string, StakeholderReviewRecord>,
  questionId: string | null,
  persona: StakeholderReviewPersona,
): MatrixCellData {
  const review = lookup.get(cellKey(questionId, persona)) ?? null;
  return {
    severity: review?.severity ?? "green",
    review,
  };
}

export function countIssuesByPersona(
  reviews: StakeholderReviewRecord[],
): Record<StakeholderReviewPersona, PersonaIssueCounts> {
  const counts = Object.fromEntries(
    STAKEHOLDER_MATRIX_PERSONAS.map((p) => [p, { red: 0, amber: 0 }]),
  ) as Record<StakeholderReviewPersona, PersonaIssueCounts>;

  for (const review of reviews) {
    if (review.severity === "red") counts[review.persona].red += 1;
    if (review.severity === "amber") counts[review.persona].amber += 1;
  }

  return counts;
}

export function rowCellBackground(
  cells: MatrixCellData[],
): "none" | "amber" | "red" {
  let worst: StakeholderReviewSeverity = "green";
  for (const cell of cells) {
    worst = maxSeverity(worst, cell.severity);
  }
  if (worst === "red") return "red";
  if (worst === "amber") return "amber";
  return "none";
}
