"use client";

import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATEGORY_LABELS,
  QUESTION_TYPE_LABELS,
} from "@/lib/question-library/constants";
import type { QuestionLibraryItem } from "@/lib/question-library/types";

type QuestionPreviewDialogProps = {
  question: QuestionLibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuestionPreviewDialog({
  question,
  open,
  onOpenChange,
}: QuestionPreviewDialogProps) {
  if (!question) return null;

  const typeLabel =
    QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType;
  const categoryLabel = CATEGORY_LABELS[question.category] ?? question.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            {question.displayId ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {question.displayId}
              </Badge>
            ) : null}
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="info">{categoryLabel}</Badge>
            {question.isLocked ? (
              <Badge variant="warning" className="gap-1">
                <Lock className="h-3 w-3" aria-hidden />
                Locked
              </Badge>
            ) : null}
            {question.language !== "en" ? (
              <Badge variant="outline">{question.language.toUpperCase()}</Badge>
            ) : null}
          </div>
          <DialogTitle className="sr-only">Question preview</DialogTitle>
          <DialogDescription className="sr-only">
            Full question text and answer options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {question.questionText}
          </div>

          {question.answerOptions.length > 0 ? (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Answer options
              </h3>
              <ul className="space-y-2">
                {question.answerOptions.map((option, index) => (
                  <li
                    key={`${index}-${option.text.slice(0, 24)}`}
                    className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm"
                  >
                    <p className="whitespace-pre-wrap text-foreground">
                      {option.text}
                    </p>
                    {option.terminate ? (
                      <p className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        Terminates screener
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No answer options for this question type.
            </p>
          )}

          {question.notes ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Usage notes
              </h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {question.notes}
              </p>
            </div>
          ) : null}

          {question.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-gradient-soft px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-inset ring-primary/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
