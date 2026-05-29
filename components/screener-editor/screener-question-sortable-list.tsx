"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CornerDownRight } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import {
  reorderSubScreenerQuestions,
  reorderTopLevelScreenerQuestions,
} from "@/app/actions/screener-questions";
import { SortableScreenerQuestionCard } from "@/components/screener-editor/sortable-screener-question-card";
import {
  reorderSubQuestionsByIds,
  reorderTopLevelQuestionsByIds,
  subQuestionIdsInOrder,
  topLevelQuestionIdsInOrder,
} from "@/lib/screeners/reorder-questions";
import {
  buildQuestionTree,
  type QuestionTreeNode,
} from "@/lib/screeners/question-tree";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

function QuestionTreeBlock({
  screenerId,
  questions,
  node,
  selectedQuestionId,
  highlightedQuestionId,
  onSelectQuestion,
  onDeleteQuestion,
  onAddSubQuestion,
  onQuestionsReplaced,
  deletingId,
  dragDisabled,
}: {
  screenerId: string;
  questions: ScreenerQuestion[];
  node: QuestionTreeNode;
  selectedQuestionId: string | null;
  highlightedQuestionId?: string | null;
  onSelectQuestion: (id: string) => void;
  onDeleteQuestion: (question: ScreenerQuestion) => void;
  onAddSubQuestion: (parentId: string) => void;
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
  deletingId: string | null;
  dragDisabled?: boolean;
}) {
  const subIds = useMemo(
    () => node.children.map((child) => child.question.id),
    [node.children],
  );

  const canAddSubQuestion = !node.question.isLocked;

  return (
    <div className="space-y-1">
      <SortableScreenerQuestionCard
        screenerId={screenerId}
        allQuestions={questions}
        onQuestionsReplaced={onQuestionsReplaced}
        question={node.question}
        displayLabel={node.label}
        selected={selectedQuestionId === node.question.id}
        highlighted={highlightedQuestionId === node.question.id}
        onSelect={() => onSelectQuestion(node.question.id)}
        onDelete={() => onDeleteQuestion(node.question)}
        deleting={deletingId === node.question.id}
        dragDisabled={dragDisabled}
      />

      {canAddSubQuestion ? (
        <button
          type="button"
          onClick={() => onAddSubQuestion(node.question.id)}
          className={cn(
            "ml-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition",
            "hover:bg-[hsl(var(--workspace-surface))] hover:text-foreground",
          )}
        >
          <CornerDownRight className="h-3.5 w-3.5" aria-hidden />
          Add sub-question
        </button>
      ) : null}

      {node.children.length > 0 ? (
        <SortableContext items={subIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {node.children.map((child) => (
              <SortableScreenerQuestionCard
                key={child.question.id}
                screenerId={screenerId}
                allQuestions={questions}
                onQuestionsReplaced={onQuestionsReplaced}
                question={child.question}
                displayLabel={child.label}
                isSubQuestion
                selected={selectedQuestionId === child.question.id}
                highlighted={highlightedQuestionId === child.question.id}
                onSelect={() => onSelectQuestion(child.question.id)}
                onDelete={() => onDeleteQuestion(child.question)}
                deleting={deletingId === child.question.id}
                dragDisabled={dragDisabled || node.children.length < 2}
              />
            ))}
          </div>
        </SortableContext>
      ) : null}
    </div>
  );
}

export function ScreenerQuestionSortableList({
  screenerId,
  questions,
  selectedQuestionId,
  highlightedQuestionId,
  onSelectQuestion,
  onDeleteQuestion,
  onAddSubQuestion,
  onQuestionsReplaced,
  deletingId,
  reorderDisabled,
}: {
  screenerId: string;
  questions: ScreenerQuestion[];
  selectedQuestionId: string | null;
  highlightedQuestionId?: string | null;
  onSelectQuestion: (id: string) => void;
  onDeleteQuestion: (question: ScreenerQuestion) => void;
  onAddSubQuestion: (parentId: string) => void;
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
  deletingId: string | null;
  reorderDisabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const tree = useMemo(() => buildQuestionTree(questions), [questions]);

  const topLevelIds = useMemo(
    () => topLevelQuestionIdsInOrder(questions),
    [questions],
  );

  const parentIdBySubId = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      if (q.parentId) map.set(q.id, q.parentId);
    }
    return map;
  }, [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const snapshot = questions;

    const activeParentId = parentIdBySubId.get(activeId);
    const overParentId = parentIdBySubId.get(overId);

    if (!activeParentId && !overParentId) {
      const oldIndex = topLevelIds.indexOf(activeId);
      const newIndex = topLevelIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;

      const nextIds = arrayMove(topLevelIds, oldIndex, newIndex);
      const optimistic = reorderTopLevelQuestionsByIds(questions, nextIds);
      if (!optimistic) {
        toast.error("Could not reorder questions.");
        return;
      }

      onQuestionsReplaced(optimistic);

      startTransition(async () => {
        const res = await reorderTopLevelScreenerQuestions({
          screenerId,
          orderedQuestionIds: nextIds,
        });

        if (!res.ok) {
          onQuestionsReplaced(snapshot);
          toast.error(res.error);
          return;
        }

        onQuestionsReplaced(res.questions);
      });
      return;
    }

    if (
      activeParentId &&
      overParentId &&
      activeParentId === overParentId
    ) {
      const siblingIds = subQuestionIdsInOrder(questions, activeParentId);
      const oldIndex = siblingIds.indexOf(activeId);
      const newIndex = siblingIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;

      const nextIds = arrayMove(siblingIds, oldIndex, newIndex);
      const optimistic = reorderSubQuestionsByIds(
        questions,
        activeParentId,
        nextIds,
      );
      if (!optimistic) {
        toast.error("Could not reorder sub-questions.");
        return;
      }

      onQuestionsReplaced(optimistic);

      startTransition(async () => {
        const res = await reorderSubScreenerQuestions({
          screenerId,
          parentId: activeParentId,
          orderedSubQuestionIds: nextIds,
        });

        if (!res.ok) {
          onQuestionsReplaced(snapshot);
          toast.error(res.error);
          return;
        }

        onQuestionsReplaced(res.questions);
      });
    }
  };

  const dragDisabled =
    reorderDisabled || pending || topLevelIds.length < 2;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={topLevelIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {tree.map((node) => (
            <QuestionTreeBlock
              key={node.question.id}
              screenerId={screenerId}
              questions={questions}
              node={node}
              selectedQuestionId={selectedQuestionId}
              highlightedQuestionId={highlightedQuestionId}
              onSelectQuestion={onSelectQuestion}
              onDeleteQuestion={onDeleteQuestion}
              onAddSubQuestion={onAddSubQuestion}
              onQuestionsReplaced={onQuestionsReplaced}
              deletingId={deletingId}
              dragDisabled={dragDisabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
