"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  Square,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { questionLabel } from "@/lib/screeners/question-types";
import type {
  DismissedQualityReviewIssue,
  QualityReviewIssue,
  QualityReviewResult,
  QualityReviewSeverity,
} from "@/lib/screeners/quality-review/types";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: QualityReviewSeverity[] = [
  "error",
  "warning",
  "info",
];

const SEVERITY_META: Record<
  QualityReviewSeverity,
  {
    label: string;
    icon: typeof AlertCircle;
    headerClass: string;
    cardClass: string;
    iconClass: string;
  }
> = {
  error: {
    label: "Errors",
    icon: AlertCircle,
    headerClass: "text-red-700 dark:text-red-300",
    cardClass:
      "border-red-200/80 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10",
    iconClass: "text-red-600 dark:text-red-400",
  },
  warning: {
    label: "Warnings",
    icon: AlertTriangle,
    headerClass: "text-amber-800 dark:text-amber-200",
    cardClass:
      "border-amber-200/80 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  info: {
    label: "Info",
    icon: Info,
    headerClass: "text-blue-800 dark:text-blue-200",
    cardClass:
      "border-blue-200/80 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
};

function questionRefLabel(
  issue: QualityReviewIssue,
  questionsByPosition: Map<number, ScreenerQuestion>,
): string {
  if (issue.question_number === null) return "Screener";
  const q = questionsByPosition.get(issue.question_number);
  if (!q) return `Q${issue.question_number}`;
  return questionLabel(issue.question_number);
}

function QualityReviewIssueCard({
  issue,
  questionRef,
  canGoToQuestion,
  onGoToQuestion,
  onDismiss,
}: {
  issue: QualityReviewIssue;
  questionRef: string;
  canGoToQuestion: boolean;
  onGoToQuestion: () => void;
  onDismiss: (reason: string) => void;
}) {
  const meta = SEVERITY_META[issue.severity];
  const Icon = meta.icon;
  const [dismissOpen, setDismissOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState("");

  const handleDismiss = () => {
    onDismiss(dismissReason.trim());
    setDismissOpen(false);
    setDismissReason("");
  };

  return (
    <li
      className={cn(
        "rounded-lg border p-4 shadow-sm",
        meta.cardClass,
      )}
    >
      <div className="flex gap-3">
        <Icon
          className={cn("mt-0.5 h-5 w-5 shrink-0", meta.iconClass)}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {issue.issue_type}
            </span>
            <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-xs font-medium text-foreground ring-1 ring-border/60">
              {questionRef}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {issue.description}
          </p>
          {issue.suggestion ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Suggestion: </span>
              {issue.suggestion}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {canGoToQuestion ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onGoToQuestion}
              >
                Go to question
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setDismissOpen((v) => !v)}
            >
              Dismiss
            </Button>
          </div>
          {dismissOpen ? (
            <div className="space-y-2 border-t border-border/40 pt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Reason for dismissing (optional)
              </label>
              <Textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Intentional for this study design"
                rows={2}
                className="min-h-[60px] resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleDismiss}
                >
                  Confirm dismiss
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setDismissOpen(false);
                    setDismissReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Docked panel — no modal overlay; editor stays interactive alongside. */
/** Expanded outline is w-56 (14rem); collapsed rail is w-11 (2.75rem). */
const OUTLINE_EXPANDED_WIDTH = "14rem";
const OUTLINE_COLLAPSED_WIDTH = "2.75rem";

export function QualityReviewPanel({
  open,
  onClose,
  loading,
  result,
  questions,
  dismissedIssues,
  onDismissIssue,
  onGoToQuestion,
  onRerun,
  onStop,
  outlineCollapsed = false,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  result: QualityReviewResult | null;
  questions: ScreenerQuestion[];
  dismissedIssues: DismissedQualityReviewIssue[];
  onDismissIssue: (issueId: string, reason: string) => void;
  onGoToQuestion: (questionId: string) => void;
  onRerun: () => void;
  onStop: () => void;
  /** When true, panel grows by the width freed from the collapsed outline. */
  outlineCollapsed?: boolean;
}) {
  const dismissedIds = useMemo(
    () => new Set(dismissedIssues.map((d) => d.issueId)),
    [dismissedIssues],
  );

  const questionsByPosition = useMemo(() => {
    const sorted = [...questions].sort((a, b) => a.position - b.position);
    const map = new Map<number, ScreenerQuestion>();
    sorted.forEach((q, index) => {
      map.set(index + 1, q);
    });
    return map;
  }, [questions]);

  const visibleIssues = useMemo(
    () => result?.issues.filter((i) => !dismissedIds.has(i.id)) ?? [],
    [result, dismissedIds],
  );

  const issuesBySeverity = useMemo(() => {
    const grouped: Record<QualityReviewSeverity, QualityReviewIssue[]> = {
      error: [],
      warning: [],
      info: [],
    };
    for (const issue of visibleIssues) {
      grouped[issue.severity].push(issue);
    }
    return grouped;
  }, [visibleIssues]);

  const resolveQuestionId = (issue: QualityReviewIssue): string | null => {
    if (issue.question_number === null) return null;
    return questionsByPosition.get(issue.question_number)?.id ?? null;
  };

  if (!open) return null;

  return (
    <aside
      className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-border/80 bg-[hsl(var(--workspace-panel))] shadow-sm transition-[width] duration-200 ease-out"
      style={{
        width: outlineCollapsed
          ? `calc(20rem + ${OUTLINE_EXPANDED_WIDTH} - ${OUTLINE_COLLAPSED_WIDTH})`
          : "20rem",
      }}
      aria-label="Quality review"
    >
      <header className="relative shrink-0 border-b border-border/60 px-5 py-4 pr-12">
        <h2 className="text-base font-semibold text-foreground">
          Quality review
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Work through findings while you edit questions in the canvas.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 text-muted-foreground"
          onClick={onClose}
          aria-label="Close quality review panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12">
            <Loader2
              className="h-8 w-8 animate-spin text-blue-600"
              aria-hidden
            />
            <p className="text-sm font-medium text-foreground">
              Reviewing your screener…
            </p>
            <p className="text-center text-xs text-muted-foreground">
              You can keep editing; results will appear here when ready.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={onStop}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop review
            </Button>
          </div>
        ) : result ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-5">
              <section className="rounded-lg border border-border/80 bg-[hsl(var(--workspace-surface))] p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {result.overall_comment || "No overall comment provided."}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Estimated interview length:{" "}
                  <span className="text-foreground">
                    {result.estimated_loi_minutes} min
                  </span>
                </p>
              </section>

              {visibleIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open issues — all findings were dismissed or none were
                  reported.
                </p>
              ) : (
                SEVERITY_ORDER.map((severity) => {
                  const group = issuesBySeverity[severity];
                  if (group.length === 0) return null;
                  const meta = SEVERITY_META[severity];
                  return (
                    <section key={severity} className="space-y-3">
                      <h3
                        className={cn(
                          "text-sm font-semibold",
                          meta.headerClass,
                        )}
                      >
                        {meta.label} ({group.length})
                      </h3>
                      <ul className="space-y-3">
                        {group.map((issue) => {
                          const questionId = resolveQuestionId(issue);
                          return (
                            <QualityReviewIssueCard
                              key={issue.id}
                              issue={issue}
                              questionRef={questionRefLabel(
                                issue,
                                questionsByPosition,
                              )}
                              canGoToQuestion={questionId !== null}
                              onGoToQuestion={() => {
                                if (questionId) onGoToQuestion(questionId);
                              }}
                              onDismiss={(reason) =>
                                onDismissIssue(issue.id, reason)
                              }
                            />
                          );
                        })}
                      </ul>
                    </section>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-muted-foreground">
            Run a review to see results here.
          </div>
        )}

        <div className="shrink-0 border-t border-border/60 px-5 py-4">
          {loading ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={onStop}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop review
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={onRerun}
            >
              <RefreshCw className="h-4 w-4" />
              Re-run review
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
