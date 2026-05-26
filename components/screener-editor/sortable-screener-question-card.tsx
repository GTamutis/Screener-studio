"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ScreenerQuestionCard } from "@/components/screener-editor/screener-question-card";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function SortableScreenerQuestionCard({
  question,
  displayPosition,
  selected,
  onSelect,
  onDelete,
  deleting,
  disabled,
}: {
  question: ScreenerQuestion;
  displayPosition: number;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandleProps = {
    attributes,
    listeners,
    setActivatorNodeRef,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`question-${question.id}`}
      className={cn(
        "touch-none",
        isDragging && "relative z-10 opacity-90",
        deleting && "opacity-60",
      )}
    >
      <ScreenerQuestionCard
        question={question}
        displayPosition={displayPosition}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDelete}
        deleting={deleting}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
      />
    </div>
  );
}
