"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Lock, Search } from "lucide-react";
import { toast } from "sonner";

import { addScreenerQuestionFromLibrary } from "@/app/actions/screener-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LIBRARY_CATEGORY_FILTERS,
  LIBRARY_LIST_TYPE_LABELS,
  type LibraryCategoryFilter,
} from "@/lib/question-library/constants";
import { filterLibraryQuestions } from "@/lib/question-library/filter";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

function formatQuestionCount(count: number): string {
  return `${count} question${count === 1 ? "" : "s"}`;
}

function LibraryQuestionCard({
  question,
  expanded,
  alreadyAdded,
  adding,
  onToggleExpand,
  onAdd,
}: {
  question: QuestionLibraryItem;
  expanded: boolean;
  alreadyAdded: boolean;
  adding: boolean;
  onToggleExpand: () => void;
  onAdd: () => void;
}) {
  const displayId = question.displayId?.trim() || "—";
  const typeLabel =
    LIBRARY_LIST_TYPE_LABELS[question.questionType] ?? question.questionType;
  const options = question.answerOptions.filter((o) => o.text.trim());

  return (
    <li className="rounded-lg border border-border/80 bg-[hsl(var(--workspace-panel))]">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="flex w-full cursor-pointer gap-2 p-2.5 text-left"
      >
        <span className="shrink-0 self-start rounded-md bg-[hsl(var(--workspace-surface))] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground ring-1 ring-border/80">
          {displayId}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs leading-snug text-foreground",
              !expanded && "line-clamp-2",
            )}
          >
            {question.questionText}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">{typeLabel}</p>
        </div>

        <div
          className="flex shrink-0 flex-col items-end gap-1.5 self-start"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {question.isLocked ? (
            <Lock
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-label="Locked"
            />
          ) : null}

          {alreadyAdded ? (
            <span className="text-[10px] font-medium text-muted-foreground">
              Added
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[10px] font-semibold"
              disabled={adding}
              onClick={onAdd}
            >
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : "+ Add"}
            </Button>
          )}
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border/60 px-2.5 pb-2.5 pt-2">
          <p className="text-xs leading-relaxed text-foreground">
            {question.questionText}
          </p>
          {options.length > 0 ? (
            <ul className="mt-2 space-y-1 border-l-2 border-border/80 pl-2.5">
              {options.map((option, index) => (
                <li
                  key={`${question.id}-opt-${index}`}
                  className="text-[11px] leading-snug text-muted-foreground"
                >
                  {option.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function ScreenerEditorLibraryPanel({
  screenerId,
  libraryQuestions,
  screenerQuestions,
  onQuestionAdded,
}: {
  screenerId: string;
  libraryQuestions: QuestionLibraryItem[];
  screenerQuestions: ScreenerQuestion[];
  onQuestionAdded: (question: ScreenerQuestion) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<LibraryCategoryFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addedLibraryIds = useMemo(
    () =>
      new Set(
        screenerQuestions
          .map((q) => q.libraryQuestionId)
          .filter((id): id is string => Boolean(id)),
      ),
    [screenerQuestions],
  );

  const filtered = useMemo(
    () => filterLibraryQuestions(libraryQuestions, query, categoryFilter),
    [libraryQuestions, query, categoryFilter],
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = (libraryQuestionId: string) => {
    setAddingId(libraryQuestionId);
    startTransition(async () => {
      const res = await addScreenerQuestionFromLibrary({
        screenerId,
        libraryQuestionId,
      });
      setAddingId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Question added to screener.");
      onQuestionAdded(res.question);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2.5 border-b border-border/80 bg-[hsl(var(--workspace-panel))] p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="h-9 w-full pl-8 text-xs"
            aria-label="Search questions"
          />
        </div>

        <div className="-mx-0.5 flex flex-wrap gap-1">
          {LIBRARY_CATEGORY_FILTERS.map((filter) => {
            const active = categoryFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setCategoryFilter(filter.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                  active
                    ? "bg-[hsl(var(--dos-navy))] text-white"
                    : "bg-[hsl(var(--workspace-surface))] text-muted-foreground ring-1 ring-border/80 hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {formatQuestionCount(filtered.length)}
        </p>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <li className="px-2 py-10 text-center text-xs text-muted-foreground">
            No questions found. Try a different search or filter.
          </li>
        ) : (
          filtered.map((question) => (
            <LibraryQuestionCard
              key={question.id}
              question={question}
              expanded={expandedIds.has(question.id)}
              alreadyAdded={addedLibraryIds.has(question.id)}
              adding={pending && addingId === question.id}
              onToggleExpand={() => toggleExpanded(question.id)}
              onAdd={() => handleAdd(question.id)}
            />
          ))
        )}
      </ul>
    </div>
  );
}
