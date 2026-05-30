"use client";

import { useEffect, useMemo, useState } from "react";

import type { StakeholderReviewRecord } from "@/app/actions/stakeholder-reviews";
import { MatrixQuestionCell } from "@/components/stakeholder-review/matrix-question-cell";
import {
  StakeholderReviewCellPopup,
  StakeholderReviewNoConcernPopup,
} from "@/components/stakeholder-review/stakeholder-review-cell-popup";
import type { StakeholderReviewPersona } from "@/lib/screeners/stakeholder-review/constants";
import { STAKEHOLDER_PERSONA_LABELS } from "@/lib/screeners/stakeholder-review/display";
import {
  buildMatrixRows,
  buildReviewLookup,
  countIssuesByPersona,
  getMatrixCell,
  type MatrixCellData,
} from "@/lib/screeners/stakeholder-review/matrix";
import { STAKEHOLDER_MATRIX_PERSONAS } from "@/lib/screeners/stakeholder-review/constants";
import type { StakeholderReviewSeverity } from "@/lib/screeners/stakeholder-review/constants";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { sortScreenerQuestions } from "@/lib/screeners/question-tree";
import { cn } from "@/lib/utils";

import { StakeholderReviewSummaryBar } from "./stakeholder-review-summary-bar";

type ActiveCell = {
  rowKey: string;
  persona: StakeholderReviewPersona;
  questionLabel: string;
  review: StakeholderReviewRecord | null;
  anchorRect: DOMRect;
};

const SEVERITY_PILL: Record<
  StakeholderReviewSeverity,
  { bg: string; border: string; dot: string; label: string; text: string }
> = {
  green: {
    bg: "#ecfdf5",
    border: "#10b981",
    dot: "#10b981",
    label: "OK",
    text: "#047857",
  },
  amber: {
    bg: "#fffbeb",
    border: "#f59e0b",
    dot: "#f59e0b",
    label: "Amber",
    text: "#b45309",
  },
  red: {
    bg: "#fef2f2",
    border: "#dc2626",
    dot: "#dc2626",
    label: "Red",
    text: "#b91c1c",
  },
};

function SeverityCell({
  cell,
  onClick,
}: {
  cell: MatrixCellData;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const pill = SEVERITY_PILL[cell.severity];
  const decision = cell.review?.userDecision ?? null;

  const decisionHint =
    decision === "implemented"
      ? " — implemented"
      : decision === "dismissed"
        ? " — dismissed"
        : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative mx-auto flex h-10 w-full max-w-[88px] cursor-pointer items-center justify-center rounded-md border-2 px-2 transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      style={{
        backgroundColor: pill.bg,
        borderColor: pill.border,
        color: pill.text,
      }}
      aria-label={`${pill.label}${decisionHint}${cell.review ? " — view feedback" : " — no concerns"}`}
    >
      {decision === "dismissed" ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-dashed border-[#94a3b8]"
          aria-hidden
        />
      ) : null}
      {decision === "implemented" ? (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white"
          title="Implemented"
          aria-hidden
        />
      ) : null}
      {decision === "dismissed" ? (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#64748b] ring-2 ring-white"
          title="Dismissed"
          aria-hidden
        />
      ) : null}
      <span className="flex items-center justify-center gap-1.5">
        <span
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
          style={{ backgroundColor: pill.dot }}
          aria-hidden
        />
        <span className="text-center text-[11px] font-bold uppercase tracking-wide leading-none">
          {pill.label}
        </span>
      </span>
    </button>
  );
}

function cellTdClass(severity: StakeholderReviewSeverity): string {
  if (severity === "red") return "sr-cell-red";
  if (severity === "amber") return "sr-cell-amber";
  return "";
}

export function StakeholderReviewMatrix({
  questions,
  reviews,
  projectId,
  screenerId,
  editorHref,
  onReviewsChange,
  onQuestionsChange,
}: {
  questions: ScreenerQuestion[];
  reviews: StakeholderReviewRecord[];
  projectId: string;
  screenerId: string;
  editorHref: string;
  onReviewsChange: (reviews: StakeholderReviewRecord[]) => void;
  onQuestionsChange: (questions: ScreenerQuestion[]) => void;
}) {
  const [localQuestions, setLocalQuestions] = useState(questions);
  const [localReviews, setLocalReviews] = useState(reviews);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);

  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  const rows = useMemo(
    () => buildMatrixRows(localQuestions),
    [localQuestions],
  );
  const lookup = useMemo(
    () => buildReviewLookup(localReviews),
    [localReviews],
  );
  const counts = useMemo(
    () => countIssuesByPersona(localReviews),
    [localReviews],
  );

  const handleReviewUpdated = (updated: StakeholderReviewRecord) => {
    setLocalReviews((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      onReviewsChange(next);
      return next;
    });
    setActiveCell((prev) =>
      prev?.review?.id === updated.id
        ? { ...prev, review: updated }
        : prev,
    );
  };

  const handleQuestionUpdated = (updated: ScreenerQuestion) => {
    setLocalQuestions((prev) => {
      const next = sortScreenerQuestions(
        prev.map((q) => (q.id === updated.id ? updated : q)),
      );
      onQuestionsChange(next);
      return next;
    });
  };

  const openCell = (
    e: React.MouseEvent<HTMLButtonElement>,
    row: (typeof rows)[number],
    persona: StakeholderReviewPersona,
    cell: MatrixCellData,
  ) => {
    setActiveCell({
      rowKey: row.key,
      persona,
      questionLabel: row.label,
      review: cell.review,
      anchorRect: e.currentTarget.getBoundingClientRect(),
    });
  };

  return (
    <div className="space-y-6">
      <StakeholderReviewSummaryBar counts={counts} />

      <div className="sr-matrix-wrap overflow-x-auto rounded-lg">
        <table className="sr-matrix w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-[40%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Question
              </th>
              {STAKEHOLDER_MATRIX_PERSONAS.map((persona) => (
                <th
                  key={persona}
                  className="px-2 py-3 text-center text-xs font-semibold leading-tight"
                >
                  {STAKEHOLDER_PERSONA_LABELS[persona]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowClass =
                rowIndex % 2 === 1 ? "sr-row-even" : "sr-row-odd";

              return (
                <tr
                  key={row.key}
                  className={cn(rowClass, row.isOverall && "font-semibold")}
                >
                  <td className="px-4 py-3 align-top">
                    <MatrixQuestionCell
                      label={row.label}
                      question={row.question}
                      screenerId={screenerId}
                      editorHref={editorHref}
                      onQuestionUpdated={handleQuestionUpdated}
                    />
                  </td>
                  {STAKEHOLDER_MATRIX_PERSONAS.map((persona) => {
                    const cell = getMatrixCell(
                      lookup,
                      row.questionId,
                      persona,
                    );

                    return (
                      <td
                        key={persona}
                        className={cn(
                          "px-2 py-2 text-center",
                          cellTdClass(cell.severity),
                        )}
                      >
                        <SeverityCell
                          cell={cell}
                          onClick={(e) => openCell(e, row, persona, cell)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeCell?.review ? (
        <StakeholderReviewCellPopup
          open
          anchorRect={activeCell.anchorRect}
          persona={activeCell.persona}
          questionLabel={activeCell.questionLabel}
          review={activeCell.review}
          projectId={projectId}
          screenerId={screenerId}
          onClose={() => setActiveCell(null)}
          onReviewUpdated={handleReviewUpdated}
        />
      ) : activeCell ? (
        <StakeholderReviewNoConcernPopup
          open
          anchorRect={activeCell.anchorRect}
          persona={activeCell.persona}
          questionLabel={activeCell.questionLabel}
          onClose={() => setActiveCell(null)}
        />
      ) : null}
    </div>
  );
}
