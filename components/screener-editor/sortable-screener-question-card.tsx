"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ScreenerQuestionCard } from "@/components/screener-editor/screener-question-card";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function SortableScreenerQuestionCard({
  question,
  displayLabel,
  isSubQuestion,
  selected,
  highlighted,
  onSelect,
  onDelete,
  deleting,
  dragDisabled,
  screenerId,
  allQuestions,
  consentPoolLibraryIds,
  onQuestionsReplaced,
}: {
  question: ScreenerQuestion;
  displayLabel: string;
  isSubQuestion?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  /** Disables drag handle only — does not affect nest/unnest actions. */
  dragDisabled?: boolean;
  screenerId: string;
  allQuestions: ScreenerQuestion[];
  consentPoolLibraryIds: Set<string>;
  onQuestionsReplaced: (questions: ScreenerQuestion[]) => void;
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
    disabled: dragDisabled,
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
        isSubQuestion && "ml-6 border-l border-border/60 pl-3",
        isDragging && "relative z-10 opacity-90",
        deleting && "opacity-60",
      )}
    >
      <ScreenerQuestionCard
        question={question}
        displayLabel={displayLabel}
        isSubQuestion={isSubQuestion}
        selected={selected}
        highlighted={highlighted}
        onSelect={onSelect}
        onDelete={onDelete}
        deleting={deleting}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
        screenerId={screenerId}
        allQuestions={allQuestions}
        onQuestionsReplaced={onQuestionsReplaced}
        consentPoolLibraryIds={consentPoolLibraryIds}
        structureDisabled={deleting}
      />
    </div>
  );
}
