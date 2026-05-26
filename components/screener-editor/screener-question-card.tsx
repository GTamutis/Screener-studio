"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { GripVertical, Lock, Trash2 } from "lucide-react";

import { AnswerOptionsTable } from "@/components/screener-editor/answer-options-table";
import { QuestionSourceBadge } from "@/components/screener-editor/question-source-badge";
import { Button } from "@/components/ui/button";
import { QUESTION_TYPE_LABELS } from "@/lib/question-library/constants";
import {
  questionLabel,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export type ScreenerQuestionDragHandleProps = {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

export function ScreenerQuestionCard({
  question,
  displayPosition,
  selected,
  onSelect,
  onDelete,
  deleting,
  dragHandleProps,
  isDragging,
}: {
  question: ScreenerQuestion;
  /** Visual order in the list (Q1, Q2, …); defaults to stored position. */
  displayPosition?: number;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  dragHandleProps?: ScreenerQuestionDragHandleProps;
  isDragging?: boolean;
}) {
  const label = questionLabel(displayPosition ?? question.position);
  const typeLabel = question.questionType
    ? QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType
    : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "group flex gap-3 rounded-xl border border-border/80 bg-[hsl(var(--workspace-panel))] p-5 shadow-sm transition",
        "hover:border-border hover:shadow-md",
        selected &&
          "ring-2 ring-blue-500 ring-offset-2 ring-offset-[hsl(var(--workspace-surface))] dark:ring-offset-[hsl(var(--workspace-surface))]",
        isDragging && "shadow-md ring-1 ring-border",
      )}
    >
      <div
        ref={dragHandleProps?.setActivatorNodeRef}
        className={cn(
          "mt-1 flex shrink-0 touch-none text-muted-foreground/60",
          dragHandleProps
            ? "cursor-grab active:cursor-grabbing hover:text-muted-foreground"
            : "cursor-default",
        )}
        aria-label={dragHandleProps ? "Drag to reorder question" : undefined}
        onClick={(e) => e.stopPropagation()}
        {...(dragHandleProps?.attributes ?? {})}
        {...(dragHandleProps?.listeners ?? {})}
      >
        <GripVertical className="h-5 w-5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-muted dark:text-foreground">
            {label}
          </span>
          <QuestionSourceBadge source={question.source} />
          {typeLabel ? (
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-800 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-200">
              {typeLabel}
            </span>
          ) : null}
          {question.isLocked ? (
            <span
              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
              title="From library — edit in the panel on the right"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">From library</span>
            </span>
          ) : null}
          {question.isCustomized ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200">
              Customised
            </span>
          ) : null}
        </div>

        <p className="text-base font-semibold leading-snug text-foreground">
          {question.questionText}
        </p>

        {question.answerOptions.length > 0 ? (
          <div className="border-t border-border/60 pt-3">
            <AnswerOptionsTable
              options={question.answerOptions}
              showLogicColumns
            />
          </div>
        ) : null}

        {question.notes?.trim() ? (
          <p className="border-t border-border/40 pt-3 font-serif text-sm italic leading-relaxed text-muted-foreground/80">
            {question.notes.trim()}
          </p>
        ) : null}

        {!question.isLocked ? (
          <div
            className="flex gap-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))] text-xs font-medium text-destructive hover:bg-destructive/5 hover:text-destructive"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
