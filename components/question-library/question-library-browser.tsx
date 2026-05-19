"use client";

import { useMemo, useState } from "react";
import { FileText, Lock, Search } from "lucide-react";

import { QuestionPreviewDialog } from "@/components/question-library/question-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/glass/empty-state";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  LIBRARY_CATEGORY_FILTERS,
  QUESTION_TYPE_LABELS,
  type LibraryCategoryFilter,
} from "@/lib/question-library/constants";
import type { QuestionLibraryItem } from "@/lib/question-library/types";

function matchesKeyword(question: QuestionLibraryItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    question.displayId,
    question.questionText,
    question.category,
    question.notes,
    ...(question.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function matchesCategoryFilter(
  question: QuestionLibraryItem,
  filter: LibraryCategoryFilter,
): boolean {
  const def = LIBRARY_CATEGORY_FILTERS.find((f) => f.id === filter);
  if (!def?.categories) return true;
  return def.categories.includes(question.category);
}

function truncateText(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}…`;
}

function QuestionCard({
  question,
  onPreview,
}: {
  question: QuestionLibraryItem;
  onPreview: (question: QuestionLibraryItem) => void;
}) {
  const typeLabel =
    QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType;
  const categoryLabel = CATEGORY_LABELS[question.category] ?? question.category;

  return (
    <GlassCard className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {question.displayId ? (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {question.displayId}
            </span>
          ) : null}
          <Badge variant="secondary" className="text-[10px]">
            {typeLabel}
          </Badge>
          <Badge variant="info" className="text-[10px]">
            {categoryLabel}
          </Badge>
        </div>
        {question.isLocked ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300"
            title="Locked question"
          >
            <Lock className="h-4 w-4" aria-hidden />
            <span className="sr-only">Locked</span>
          </span>
        ) : null}
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
        {truncateText(question.questionText)}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        <p className="text-[11px] text-muted-foreground">
          {question.answerOptions.length > 0
            ? `${question.answerOptions.length} answer option${question.answerOptions.length === 1 ? "" : "s"}`
            : "No answer options"}
        </p>
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={() => onPreview(question)}
        >
          Preview
        </Button>
      </div>
    </GlassCard>
  );
}

type QuestionLibraryBrowserProps = {
  questions: QuestionLibraryItem[];
};

export function QuestionLibraryBrowser({
  questions,
}: QuestionLibraryBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<LibraryCategoryFilter>("all");
  const [previewQuestion, setPreviewQuestion] =
    useState<QuestionLibraryItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(() => {
    return questions.filter(
      (q) =>
        matchesCategoryFilter(q, categoryFilter) && matchesKeyword(q, query),
    );
  }, [questions, categoryFilter, query]);

  function openPreview(question: QuestionLibraryItem) {
    setPreviewQuestion(question);
    setPreviewOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword, ID, tag, or category…"
            className="pl-9"
            aria-label="Search questions"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {LIBRARY_CATEGORY_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant={categoryFilter === filter.id ? "default" : "glass"}
              className={cn(
                "rounded-full",
                categoryFilter === filter.id && "shadow-glow-primary",
              )}
              onClick={() => setCategoryFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          of {questions.length} approved questions
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No questions match"
          description={
            query.trim()
              ? "Try a different keyword or clear the category filter."
              : "No approved questions in this category yet."
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((question) => (
            <li key={question.id}>
              <QuestionCard question={question} onPreview={openPreview} />
            </li>
          ))}
        </ul>
      )}

      <QuestionPreviewDialog
        question={previewQuestion}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewQuestion(null);
        }}
      />
    </div>
  );
}
