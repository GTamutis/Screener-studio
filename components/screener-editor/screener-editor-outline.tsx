"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  questionLabel,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function ScreenerEditorOutline({
  questions,
  selectedQuestionId,
  onSelectQuestion,
}: {
  questions: ScreenerQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
}) {
  const handleAddSection = () => {
    toast.message("Add section coming soon");
  };

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50/80 dark:border-border dark:bg-muted/20">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-border">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Outline · {questions.length} question
          {questions.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          <p className="px-2 py-1.5 text-xs font-semibold text-foreground">
            Questions
          </p>
          {questions.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No questions yet
            </p>
          ) : (
            <ul className="space-y-0.5">
              {questions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => onSelectQuestion(q.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition",
                      selectedQuestionId === q.id
                        ? "bg-blue-50 text-blue-900 dark:bg-blue-500/15 dark:text-blue-100"
                        : "text-foreground hover:bg-white/80 dark:hover:bg-card/60",
                    )}
                  >
                    <span className="shrink-0 font-mono font-semibold text-muted-foreground">
                      {questionLabel(q.position)}
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 font-medium">
                      {q.questionText}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-border">
        <button
          type="button"
          onClick={handleAddSection}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-muted-foreground transition hover:bg-white hover:text-foreground dark:hover:bg-card"
        >
          <Plus className="h-3.5 w-3.5" />
          Add section
        </button>
      </div>
    </aside>
  );
}
