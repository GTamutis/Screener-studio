import {
  LIBRARY_CATEGORY_FILTERS,
  type LibraryCategoryFilter,
} from "@/lib/question-library/constants";
import type { QuestionLibraryItem } from "@/lib/question-library/types";

export function matchesLibraryKeyword(
  question: QuestionLibraryItem,
  query: string,
): boolean {
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

export function matchesLibraryCategoryFilter(
  question: QuestionLibraryItem,
  filter: LibraryCategoryFilter,
): boolean {
  const def = LIBRARY_CATEGORY_FILTERS.find((f) => f.id === filter);
  if (!def?.categories) return true;
  return def.categories.includes(question.category);
}

export function filterLibraryQuestions(
  questions: QuestionLibraryItem[],
  query: string,
  categoryFilter: LibraryCategoryFilter,
): QuestionLibraryItem[] {
  return questions.filter(
    (q) =>
      matchesLibraryCategoryFilter(q, categoryFilter) &&
      matchesLibraryKeyword(q, query),
  );
}
