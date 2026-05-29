"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";

import { ScreenerQuotasOutline } from "@/components/screener-editor/screener-quotas-outline";
import { Button } from "@/components/ui/button";
import {
  buildQuestionTree,
  flattenQuestionTree,
} from "@/lib/screeners/question-tree";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

const OUTLINE_COLLAPSED_KEY = "screener-editor-outline-collapsed";

export function ScreenerEditorOutline({
  questions,
  markets,
  selectedQuestionId,
  onSelectQuestion,
  onCollapsedChange,
}: {
  questions: ScreenerQuestion[];
  markets: string[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const flatItems = useMemo(
    () => flattenQuestionTree(buildQuestionTree(questions)),
    [questions],
  );

  const topLevelCount = useMemo(
    () => questions.filter((q) => q.parentId === null).length,
    [questions],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(OUTLINE_COLLAPSED_KEY);
      if (stored === "true") {
        setCollapsed(true);
        onCollapsedChange?.(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [onCollapsedChange]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(OUTLINE_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      onCollapsedChange?.(next);
      return next;
    });
  };

  if (collapsed) {
    return (
      <aside
        className="flex h-full min-h-0 w-11 shrink-0 flex-col items-center border-r border-border/80 bg-[hsl(var(--workspace-surface))] py-3"
        aria-label="Screener outline (collapsed)"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          onClick={toggleCollapsed}
          title="Show outline"
          aria-expanded={false}
          aria-controls="screener-editor-outline"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="sr-only">Show outline</span>
        </Button>
        <div
          className="mt-3 flex flex-1 flex-col items-center gap-2"
          aria-hidden
        >
          <ListTree className="h-4 w-4 text-muted-foreground/70" />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            Outline
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="screener-editor-outline"
      className="flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-border/80 bg-[hsl(var(--workspace-surface))]"
      aria-label="Screener outline"
    >
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/80">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-1 border-b border-border/80 bg-[hsl(var(--workspace-panel))] px-2 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              onClick={toggleCollapsed}
              title="Hide outline"
              aria-expanded={true}
              aria-controls="screener-editor-outline"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="sr-only">Hide outline</span>
            </Button>
            <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Outline · {topLevelCount} question
              {topLevelCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[hsl(var(--workspace-panel))] p-2">
            <div className="space-y-0.5">
              <p className="px-2 py-1.5 text-xs font-semibold text-foreground">
                Questions
              </p>
              {flatItems.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  No questions yet
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {flatItems.map((item) => (
                    <li key={item.question.id}>
                      <button
                        type="button"
                        onClick={() => onSelectQuestion(item.question.id)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition",
                          item.isSubQuestion && "ml-3",
                          selectedQuestionId === item.question.id
                            ? "bg-blue-50 text-blue-900 dark:bg-blue-500/15 dark:text-blue-100"
                            : "text-foreground hover:bg-[hsl(var(--workspace-surface))]",
                        )}
                      >
                        <span className="shrink-0 font-mono font-semibold text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="line-clamp-2 min-w-0 flex-1 font-medium">
                          {item.question.questionText}
                        </span>
                        {item.question.quotaConfig?.enabled ? (
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
