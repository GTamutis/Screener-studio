"use client";

import { BookOpen, Bot, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteScreenerQuestion,
  deleteScreenerQuestionWithChildren,
} from "@/app/actions/screener-questions";
import { AddManualQuestionSheet } from "@/components/screener-editor/add-manual-question-sheet";
import { ScreenerQuestionSortableList } from "@/components/screener-editor/screener-question-sortable-list";
import { Button } from "@/components/ui/button";
import { countSubQuestions } from "@/lib/screeners/question-tree";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export function ScreenerEditorCanvas({
  screener,
  questions,
  selectedQuestionId,
  highlightedQuestionId,
  onSelectQuestion,
  onDeselectQuestion,
  onQuestionAdded,
  onQuestionsReplaced,
  onOpenAiChat,
}: {
  screener: ScreenerWithProject;
  questions: ScreenerQuestion[];
  selectedQuestionId: string | null;
  highlightedQuestionId?: string | null;
  onSelectQuestion: (id: string) => void;
  onDeselectQuestion: () => void;
  onQuestionAdded: (question: ScreenerQuestion) => void;
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
  onOpenAiChat?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);
  const [subQuestionParentId, setSubQuestionParentId] = useState<string | null>(
    null,
  );

  const handleAddLibrary = () => toast.message("Use the Library tab on the right");

  const handleAskAi = () => {
    if (onOpenAiChat) {
      onOpenAiChat();
      return;
    }
    toast.message("Open the AI Chat tab on the right");
  };

  const handleOpenManualSheet = (parentId?: string | null) => {
    setSubQuestionParentId(parentId ?? null);
    setManualSheetOpen(true);
  };

  const handleManualSheetOpenChange = (open: boolean) => {
    setManualSheetOpen(open);
    if (!open) setSubQuestionParentId(null);
  };

  const handleDelete = (question: ScreenerQuestion) => {
    if (question.isLocked) return;

    const label = question.questionText.slice(0, 80);
    const isTopLevel = question.parentId === null;
    const subCount = isTopLevel
      ? countSubQuestions(questions, question.id)
      : 0;

    let message: string;
    if (subCount > 0) {
      message = `This question has ${subCount} sub-question${subCount === 1 ? "" : "s"}. Deleting it will also delete all sub-questions. Are you sure?`;
    } else {
      message = label
        ? `Delete this question?\n\n"${label}${question.questionText.length > 80 ? "…" : ""}"`
        : "Delete this question?";
    }

    if (!confirm(message)) return;

    setDeletingId(question.id);
    startTransition(async () => {
      const res =
        subCount > 0
          ? await deleteScreenerQuestionWithChildren({
              screenerId: screener.id,
              questionId: question.id,
            })
          : await deleteScreenerQuestion({
              screenerId: screener.id,
              questionId: question.id,
            });
      setDeletingId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Question deleted.");
      if (selectedQuestionId === question.id) {
        onDeselectQuestion();
      }
      onQuestionsReplaced(res.questions);
    });
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--workspace-surface))]">
      <div className="shrink-0 border-b border-border/80 bg-[hsl(var(--workspace-panel))] px-6 py-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {screener.clientName} · {screener.projectNumber}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          {screener.name}
        </h1>
      </div>

      <div
        id="screener-canvas-scroll"
        className="flex-1 overflow-y-auto px-6 py-6"
        onClick={() => onDeselectQuestion()}
      >
        <div
          className="mx-auto max-w-3xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {questions.filter((q) => q.parentId === null).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-[hsl(var(--workspace-panel))] px-8 py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-foreground">
                No questions yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a manual question, pull from the library, or ask AI to draft
                one.
              </p>
            </div>
          ) : (
            <ScreenerQuestionSortableList
              screenerId={screener.id}
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              highlightedQuestionId={highlightedQuestionId}
              onSelectQuestion={onSelectQuestion}
              onDeleteQuestion={handleDelete}
              onAddSubQuestion={(parentId) => handleOpenManualSheet(parentId)}
              onQuestionsReplaced={onQuestionsReplaced}
              deletingId={deletingId}
              reorderDisabled={pending}
            />
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-border/80 bg-[hsl(var(--workspace-panel))] shadow-sm"
              onClick={() => handleOpenManualSheet(null)}
            >
              <Plus className="h-4 w-4" />
              Add manual question
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-border/80 bg-[hsl(var(--workspace-panel))] shadow-sm"
              onClick={handleAddLibrary}
            >
              <BookOpen className="h-4 w-4" />
              Add from library
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-border/80 bg-[hsl(var(--workspace-panel))] shadow-sm"
              onClick={handleAskAi}
            >
              <Bot className="h-4 w-4" />
              Ask AI
            </Button>
          </div>
        </div>
      </div>

      <AddManualQuestionSheet
        screenerId={screener.id}
        parentId={subQuestionParentId}
        open={manualSheetOpen}
        onOpenChange={handleManualSheetOpenChange}
        onQuestionAdded={onQuestionAdded}
      />
    </section>
  );
}
