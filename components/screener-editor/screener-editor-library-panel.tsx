"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Lock, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { addScreenerQuestionFromLibrary } from "@/app/actions/screener-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  LIBRARY_CATEGORY_FILTERS,
  QUESTION_TYPE_LABELS,
  type LibraryCategoryFilter,
} from "@/lib/question-library/constants";
import { filterLibraryQuestions } from "@/lib/question-library/filter";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

function truncateText(text: string, max = 120): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}…`;
}

function LibraryQuestionRow({
  question,
  alreadyAdded,
  adding,
  onAdd,
}: {
  question: QuestionLibraryItem;
  alreadyAdded: boolean;
  adding: boolean;
  onAdd: () => void;
}) {
  const typeLabel =
    QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType;
  const categoryLabel = CATEGORY_LABELS[question.category] ?? question.category;

  return (
    <li className="rounded-lg border border-border/80 bg-[hsl(var(--workspace-surface))] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded bg-[hsl(var(--workspace-panel))] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/80">
              {typeLabel}
            </span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
              {categoryLabel}
            </span>
            {question.isLocked ? (
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-label="Locked"
              />
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-foreground">
            {truncateText(question.questionText)}
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className="mt-3 h-8 w-full gap-1.5 text-xs"
        disabled={alreadyAdded || adding}
        onClick={onAdd}
      >
        {adding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {alreadyAdded ? "Added" : "Add to screener"}
      </Button>
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
      <div className="shrink-0 space-y-3 border-b border-border/80 p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search library…"
            className="h-9 pl-8 text-xs"
            aria-label="Search question library"
          />
        </div>

        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          {LIBRARY_CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategoryFilter(filter.id)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                categoryFilter === filter.id
                  ? "bg-blue-600 text-white"
                  : "bg-[hsl(var(--workspace-surface))] text-muted-foreground hover:bg-[hsl(var(--workspace-surface))]/80 hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground">
          {filtered.length} of {libraryQuestions.length} questions
        </p>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <li className="px-2 py-8 text-center text-xs text-muted-foreground">
            {query.trim()
              ? "No questions match your search."
              : "No questions in this category."}
          </li>
        ) : (
          filtered.map((question) => (
            <LibraryQuestionRow
              key={question.id}
              question={question}
              alreadyAdded={addedLibraryIds.has(question.id)}
              adding={pending && addingId === question.id}
              onAdd={() => handleAdd(question.id)}
            />
          ))
        )}
      </ul>
    </div>
  );
}
