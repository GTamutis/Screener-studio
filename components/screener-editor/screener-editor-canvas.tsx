"use client";

import { BookOpen, Bot, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteScreenerQuestion } from "@/app/actions/screener-questions";
import { AddManualQuestionSheet } from "@/components/screener-editor/add-manual-question-sheet";
import { ScreenerQuestionCard } from "@/components/screener-editor/screener-question-card";
import { Button } from "@/components/ui/button";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import { cn } from "@/lib/utils";

export function ScreenerEditorCanvas({
  screener,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onDeselectQuestion,
  onQuestionAdded,
  onQuestionsReplaced,
}: {
  screener: ScreenerWithProject;
  questions: ScreenerQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onDeselectQuestion: () => void;
  onQuestionAdded: (question: ScreenerQuestion) => void;
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);

  const handleAddLibrary = () => toast.message("Use the Library tab on the right");

  const handleAskAi = () => toast.message("Ask AI coming soon");

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
    <section className="flex min-w-0 flex-1 flex-col bg-gray-100/90 dark:bg-muted/30">
      <div className="border-b border-gray-200/80 bg-gray-100/90 px-6 py-5 dark:border-border dark:bg-muted/30">
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
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-8 py-16 text-center dark:border-border dark:bg-card/40">
              <p className="text-sm font-medium text-foreground">
                No questions yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a manual question, pull from the library, or ask AI to draft
                one.
              </p>
            </div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                id={`question-${question.id}`}
                className={cn(
                  pending && deletingId === question.id && "opacity-60",
                )}
              >
                <ScreenerQuestionCard
                  question={question}
                  selected={selectedQuestionId === question.id}
                  onSelect={() => onSelectQuestion(question.id)}
                  onDelete={() => handleDelete(question)}
                  deleting={deletingId === question.id}
                />
              </div>
            ))
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-gray-200 bg-white shadow-sm dark:bg-card"
              onClick={() => setManualSheetOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add manual question
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-gray-200 bg-white shadow-sm dark:bg-card"
              onClick={handleAddLibrary}
            >
              <BookOpen className="h-4 w-4" />
              Add from library
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-gray-200 bg-white shadow-sm dark:bg-card"
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
