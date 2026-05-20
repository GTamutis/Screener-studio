"use client";

import { GripVertical, Lock, Trash2 } from "lucide-react";

import { QuestionSourceBadge } from "@/components/screener-editor/question-source-badge";
import { Button } from "@/components/ui/button";
import { QUESTION_TYPE_LABELS } from "@/lib/question-library/constants";
import {
  questionLabel,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function ScreenerQuestionCard({
  question,
  selected,
  onSelect,
  onDelete,
  deleting,
}: {
  question: ScreenerQuestion;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const label = questionLabel(question.position);
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
        "group flex gap-3 rounded-xl border bg-white p-5 shadow-sm transition",
        "border-gray-200 hover:border-gray-300 dark:border-border dark:bg-card",
        selected &&
          "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-background",
      )}
    >
      <div
        className="mt-1 flex shrink-0 cursor-grab text-gray-300 active:cursor-grabbing dark:text-muted-foreground"
        aria-hidden
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5" />
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
          <ul className="space-y-1.5 border-t border-gray-100 pt-3 dark:border-border/60">
            {question.answerOptions.map((option, index) => (
              <li
                key={`${index}-${option.text.slice(0, 16)}`}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <span className="text-muted-foreground">{option.text}</span>
                {option.terminate ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Terminate
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
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
              className="h-8 gap-1.5 border-gray-200 bg-white text-xs font-medium text-destructive hover:bg-destructive/5 hover:text-destructive"
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
