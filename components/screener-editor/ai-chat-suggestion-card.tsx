"use client";

import { Loader2, Plus, X } from "lucide-react";

import { AnswerOptionsTable } from "@/components/screener-editor/answer-options-table";
import { QuestionSourceBadge } from "@/components/screener-editor/question-source-badge";
import { Button } from "@/components/ui/button";
import { QUESTION_TYPE_LABELS } from "@/lib/question-library/constants";
import type { AiSuggestedQuestion } from "@/lib/screeners/ai-chat/types";
import { questionTypeHasOptions } from "@/lib/screeners/manual-question";

export function AiChatSuggestionCard({
  suggestion,
  adding,
  onAdd,
  onDismiss,
}: {
  suggestion: AiSuggestedQuestion;
  adding: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  const typeLabel =
    QUESTION_TYPE_LABELS[suggestion.questionType] ?? suggestion.questionType;
  const showOptions =
    questionTypeHasOptions(suggestion.questionType) &&
    suggestion.answerOptions.length > 0;

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <QuestionSourceBadge source="ai_draft" />
        <span className="rounded bg-[hsl(var(--workspace-panel))] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/80">
          {typeLabel}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-foreground">
        {suggestion.questionText}
      </p>

      {showOptions ? (
        <div className="mt-2 border-t border-amber-200/60 pt-2 dark:border-amber-500/20">
          <AnswerOptionsTable
            options={suggestion.answerOptions}
            showLogicColumns
          />
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 flex-1 gap-1.5 text-xs"
          disabled={adding}
          onClick={onAdd}
        >
          {adding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add to Screener
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          disabled={adding}
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
