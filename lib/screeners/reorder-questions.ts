import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { sortScreenerQuestions } from "@/lib/screeners/question-tree";

/** Reorder top-level questions locally and assign positions 1…n. */
export function reorderTopLevelQuestionsByIds(
  questions: ScreenerQuestion[],
  orderedTopLevelIds: string[],
): ScreenerQuestion[] | null {
  const topLevel = questions.filter((q) => q.parentId === null);
  if (orderedTopLevelIds.length !== topLevel.length) return null;

  const byId = new Map(questions.map((q) => [q.id, q]));
  const positionById = new Map<string, number>();

  for (let index = 0; index < orderedTopLevelIds.length; index++) {
    const question = byId.get(orderedTopLevelIds[index]);
    if (!question || question.parentId !== null) return null;
    positionById.set(question.id, index + 1);
  }

  return questions.map((q) => {
    if (q.parentId === null) {
      return { ...q, position: positionById.get(q.id) ?? q.position };
    }
    const parentPosition = positionById.get(q.parentId);
    if (parentPosition !== undefined) {
      return { ...q, position: parentPosition };
    }
    return q;
  });
}

/** Reorder sub-questions within a parent locally and assign sub_position 0…n. */
export function reorderSubQuestionsByIds(
  questions: ScreenerQuestion[],
  parentId: string,
  orderedSubIds: string[],
): ScreenerQuestion[] | null {
  const siblings = questions.filter((q) => q.parentId === parentId);
  if (orderedSubIds.length !== siblings.length) return null;

  const byId = new Map(questions.map((q) => [q.id, q]));
  const subPositionById = new Map<string, number>();

  for (let index = 0; index < orderedSubIds.length; index++) {
    const question = byId.get(orderedSubIds[index]);
    if (!question || question.parentId !== parentId) return null;
    subPositionById.set(question.id, index);
  }

  return questions.map((q) => {
    const nextSub = subPositionById.get(q.id);
    if (nextSub !== undefined) {
      return { ...q, subPosition: nextSub };
    }
    return q;
  });
}

/** @deprecated Use reorderTopLevelQuestionsByIds for top-level reorder. */
export function reorderQuestionsByIds(
  questions: ScreenerQuestion[],
  orderedIds: string[],
): ScreenerQuestion[] | null {
  return reorderTopLevelQuestionsByIds(questions, orderedIds);
}

export function topLevelQuestionIdsInOrder(
  questions: ScreenerQuestion[],
): string[] {
  return sortScreenerQuestions(questions)
    .filter((q) => q.parentId === null)
    .map((q) => q.id);
}

export function subQuestionIdsInOrder(
  questions: ScreenerQuestion[],
  parentId: string,
): string[] {
  return questions
    .filter((q) => q.parentId === parentId)
    .sort((a, b) => (a.subPosition ?? 0) - (b.subPosition ?? 0))
    .map((q) => q.id);
}

/** @deprecated Use topLevelQuestionIdsInOrder. */
export function questionIdsInOrder(questions: ScreenerQuestion[]): string[] {
  return topLevelQuestionIdsInOrder(questions);
}
