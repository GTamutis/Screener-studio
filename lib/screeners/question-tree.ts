import type { ScreenerQuestion } from "@/lib/screeners/question-types";

export type QuestionTreeNode = {
  question: ScreenerQuestion;
  children: QuestionTreeNode[];
  /** Top-level number (1-based); null for sub-questions. */
  topLevelNumber: number | null;
  /** Display label, e.g. Q1, Q2a. */
  label: string;
};

export type FlatQuestionItem = {
  question: ScreenerQuestion;
  label: string;
  isSubQuestion: boolean;
  topLevelNumber: number | null;
  parentId: string | null;
};

function subPositionLetter(subPosition: number): string {
  return String.fromCharCode("a".charCodeAt(0) + subPosition);
}

export function questionLabelForTopLevel(topLevelNumber: number): string {
  return `Q${topLevelNumber}`;
}

export function questionLabelForSubQuestion(
  topLevelNumber: number,
  subPosition: number,
): string {
  return `Q${topLevelNumber}${subPositionLetter(subPosition)}`;
}

/** Sort all questions: top-level by position, then sub-questions by sub_position. */
export function sortScreenerQuestions(
  questions: ScreenerQuestion[],
): ScreenerQuestion[] {
  return [...questions].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    const aSub = a.subPosition ?? -1;
    const bSub = b.subPosition ?? -1;
    if (a.parentId === null && b.parentId !== null) return -1;
    if (a.parentId !== null && b.parentId === null) return 1;
    return aSub - bSub;
  });
}

export function topLevelQuestions(
  questions: ScreenerQuestion[],
): ScreenerQuestion[] {
  return sortScreenerQuestions(questions).filter((q) => q.parentId === null);
}

export function subQuestionsOf(
  questions: ScreenerQuestion[],
  parentId: string,
): ScreenerQuestion[] {
  return sortScreenerQuestions(questions)
    .filter((q) => q.parentId === parentId)
    .sort((a, b) => (a.subPosition ?? 0) - (b.subPosition ?? 0));
}

export function countSubQuestions(
  questions: ScreenerQuestion[],
  parentId: string,
): number {
  return questions.filter((q) => q.parentId === parentId).length;
}

export function buildQuestionTree(
  questions: ScreenerQuestion[],
): QuestionTreeNode[] {
  const sorted = sortScreenerQuestions(questions);
  const topLevel = sorted.filter((q) => q.parentId === null);
  const childrenByParent = new Map<string, ScreenerQuestion[]>();

  for (const q of sorted) {
    if (q.parentId) {
      const siblings = childrenByParent.get(q.parentId) ?? [];
      siblings.push(q);
      childrenByParent.set(q.parentId, siblings);
    }
  }

  return topLevel.map((question, index) => {
    const topLevelNumber = index + 1;
    const children = (childrenByParent.get(question.id) ?? [])
      .sort((a, b) => (a.subPosition ?? 0) - (b.subPosition ?? 0))
      .map((child, childIndex) => ({
        question: child,
        topLevelNumber: null,
        label: questionLabelForSubQuestion(topLevelNumber, childIndex),
        children: [] as QuestionTreeNode[],
      }));

    return {
      question,
      topLevelNumber,
      label: questionLabelForTopLevel(topLevelNumber),
      children,
    };
  });
}

/** Flatten tree for canvas rendering (parent followed by its children). */
export function flattenQuestionTree(
  tree: QuestionTreeNode[],
): FlatQuestionItem[] {
  const flat: FlatQuestionItem[] = [];

  for (const node of tree) {
    flat.push({
      question: node.question,
      label: node.label,
      isSubQuestion: false,
      topLevelNumber: node.topLevelNumber,
      parentId: null,
    });

    for (const child of node.children) {
      flat.push({
        question: child.question,
        label: child.label,
        isSubQuestion: true,
        topLevelNumber: node.topLevelNumber,
        parentId: node.question.id,
      });
    }
  }

  return flat;
}

export function computeQuestionLabels(
  questions: ScreenerQuestion[],
): Map<string, string> {
  const labels = new Map<string, string>();
  const tree = buildQuestionTree(questions);

  for (const node of tree) {
    labels.set(node.question.id, node.label);
    for (const child of node.children) {
      labels.set(child.question.id, child.label);
    }
  }

  return labels;
}

export function getQuestionLabel(
  questions: ScreenerQuestion[],
  questionId: string,
): string {
  const labels = computeQuestionLabels(questions);
  return labels.get(questionId) ?? "Q?";
}

export function questionHasSubQuestions(
  questions: ScreenerQuestion[],
  questionId: string,
): boolean {
  return questions.some((q) => q.parentId === questionId);
}

/** Top-level parents this question can be nested under (one level only). */
export function listNestUnderTargets(
  questions: ScreenerQuestion[],
  questionId: string,
): { id: string; label: string }[] {
  if (questionHasSubQuestions(questions, questionId)) return [];

  return buildQuestionTree(questions)
    .filter((node) => node.question.id !== questionId)
    .map((node) => ({ id: node.question.id, label: node.label }));
}

/** Ordered export list: top-level and sub-questions in display order. */
export function orderedExportQuestions(
  questions: ScreenerQuestion[],
): FlatQuestionItem[] {
  return flattenQuestionTree(buildQuestionTree(questions));
}
