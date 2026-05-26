"use client";

import { ScreenerQuotasOutline } from "@/components/screener-editor/screener-quotas-outline";
import {
  questionLabel,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function ScreenerEditorOutline({
  questions,
  markets,
  selectedQuestionId,
  onSelectQuestion,
}: {
  questions: ScreenerQuestion[];
  markets: string[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-border/80 bg-[hsl(var(--workspace-surface))]">
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/80">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/80 bg-[hsl(var(--workspace-panel))] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Outline · {questions.length} question
              {questions.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--workspace-panel))] p-2">
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
                            : "text-foreground hover:bg-[hsl(var(--workspace-surface))]",
                        )}
                      >
                        <span className="shrink-0 font-mono font-semibold text-muted-foreground">
                          {questionLabel(q.position)}
                        </span>
                        <span className="line-clamp-2 min-w-0 flex-1 font-medium">
                          {q.questionText}
                        </span>
                        {q.quotaConfig?.enabled ? (
                          <span
                            className="shrink-0 rounded bg-violet-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                            title="Quotas enabled"
                          >
                            Q
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <ScreenerQuotasOutline
          questions={questions}
          markets={markets}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={onSelectQuestion}
        />
      </div>
    </aside>
  );
}
