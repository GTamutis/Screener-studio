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
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import { reorderScreenerQuestions } from "@/app/actions/screener-questions";
import { SortableScreenerQuestionCard } from "@/components/screener-editor/sortable-screener-question-card";
import { reorderQuestionsByIds } from "@/lib/screeners/reorder-questions";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";

export function ScreenerQuestionSortableList({
  screenerId,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onDeleteQuestion,
  onQuestionsReplaced,
  deletingId,
  reorderDisabled,
}: {
  screenerId: string;
  questions: ScreenerQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onDeleteQuestion: (question: ScreenerQuestion) => void;
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
  deletingId: string | null;
  reorderDisabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.position - b.position),
    [questions],
  );

  const itemIds = useMemo(
    () => sortedQuestions.map((q) => q.id),
    [sortedQuestions],
  );

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

    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const nextIds = arrayMove(itemIds, oldIndex, newIndex);
    const snapshot = questions;
    const optimistic = reorderQuestionsByIds(questions, nextIds);

    if (!optimistic) {
      toast.error("Could not reorder questions.");
      return;
    }

    onQuestionsReplaced(optimistic);

    startTransition(async () => {
      const res = await reorderScreenerQuestions({
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
  };

  const dragDisabled = reorderDisabled || pending || sortedQuestions.length < 2;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => (
            <SortableScreenerQuestionCard
              key={question.id}
              question={question}
              displayPosition={index + 1}
              selected={selectedQuestionId === question.id}
              onSelect={() => onSelectQuestion(question.id)}
              onDelete={() => onDeleteQuestion(question)}
              deleting={deletingId === question.id}
              disabled={dragDisabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
