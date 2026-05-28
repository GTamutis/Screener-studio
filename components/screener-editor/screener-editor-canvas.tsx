"use client";

import { BookOpen, Bot, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteScreenerQuestion } from "@/app/actions/screener-questions";
import { AddManualQuestionSheet } from "@/components/screener-editor/add-manual-question-sheet";
import { ScreenerQuestionSortableList } from "@/components/screener-editor/screener-question-sortable-list";
import { Button } from "@/components/ui/button";
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

  const handleAddLibrary = () => toast.message("Use the Library tab on the right");

  const handleAskAi = () => {
    if (onOpenAiChat) {
      onOpenAiChat();
      return;
    }
    toast.message("Open the AI Chat tab on the right");
  };

  const handleDelete = (question: ScreenerQuestion) => {
    if (question.isLocked) return;

    const label = question.questionText.slice(0, 80);
    const message = label
      ? `Delete this question?\n\n"${label}${question.questionText.length > 80 ? "…" : ""}"`
      : "Delete this question?";

    if (!confirm(message)) return;

    setDeletingId(question.id);
    startTransition(async () => {
      const res = await deleteScreenerQuestion({
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
        className="flex-1 overflow-y-auto px-6 py-6"
        onClick={() => onDeselectQuestion()}
      >
        <div
          className="mx-auto max-w-3xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {questions.length === 0 ? (
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
              onClick={() => setManualSheetOpen(true)}
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
        open={manualSheetOpen}
        onOpenChange={setManualSheetOpen}
        onQuestionAdded={onQuestionAdded}
      />
    </section>
  );
}
