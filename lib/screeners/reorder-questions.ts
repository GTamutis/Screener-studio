import type { ScreenerQuestion } from "@/lib/screeners/question-types";

/** Reorder questions locally and assign positions 1…n from the new id order. */
export function reorderQuestionsByIds(
  questions: ScreenerQuestion[],
  orderedIds: string[],
): ScreenerQuestion[] | null {
  if (orderedIds.length !== questions.length) return null;

  const byId = new Map(questions.map((q) => [q.id, q]));
  const reordered: ScreenerQuestion[] = [];

  for (let index = 0; index < orderedIds.length; index++) {
    const question = byId.get(orderedIds[index]);
    if (!question) return null;
    reordered.push({ ...question, position: index + 1 });
  }

  return reordered;
}

export function questionIdsInOrder(questions: ScreenerQuestion[]): string[] {
  return [...questions]
    .sort((a, b) => a.position - b.position)
    .map((q) => q.id);
}
