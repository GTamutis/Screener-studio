"use client";

import { useMemo } from "react";

import {
  collectScreenerQuotaSummary,
  type ScreenerQuotaSummaryEntry,
} from "@/lib/screeners/question-quotas";
import { questionLabel, type ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

function truncate(text: string, max = 48): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}…`;
}

function QuotaEntryBlock({
  entry,
  selected,
  onSelect,
}: {
  entry: ScreenerQuotaSummaryEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-lg px-2 py-2 text-left transition",
          selected
            ? "bg-blue-50 text-blue-900 dark:bg-blue-500/15 dark:text-blue-100"
            : "hover:bg-[hsl(var(--workspace-panel))]",
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {questionLabel(entry.position)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs font-medium text-foreground">
          {truncate(entry.questionText, 56)}
        </p>
        {!entry.hasTargets ? (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Targets not set yet
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {entry.options
              .filter((opt) => opt.markets.length > 0)
              .map((opt) => (
                <li key={opt.optionText} className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-foreground/90">
                    {truncate(opt.optionText, 40)}
                  </p>
                  <ul className="space-y-0.5 pl-2">
                    {opt.markets.map(({ market, target }) => (
                      <li
                        key={`${opt.optionText}-${market}`}
                        className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground"
                      >
                        <span className="truncate">{market}</span>
                        <span className="shrink-0 tabular-nums font-medium text-foreground">
                          {target}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        )}
      </button>
    </li>
  );
}

export function ScreenerQuotasOutline({
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
  const quotaEntries = useMemo(
    () => collectScreenerQuotaSummary(questions, markets),
    [questions, markets],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--workspace-panel))]">
      <div className="shrink-0 border-b border-border/80 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Quotas · {quotaEntries.length} question
          {quotaEntries.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {quotaEntries.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground">
            No quotas yet. Open a question, go to the Quotas tab, and enable
            &ldquo;Apply quotas on this question&rdquo; to add it here.
          </p>
        ) : (
          <ul className="space-y-1">
            {quotaEntries.map((entry) => (
              <QuotaEntryBlock
                key={entry.questionId}
                entry={entry}
                selected={selectedQuestionId === entry.questionId}
                onSelect={() => onSelectQuestion(entry.questionId)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
