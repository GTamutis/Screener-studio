"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updateScreenerQuestion } from "@/app/actions/screener-questions";
import { ComingSoonPanel } from "@/components/screener-editor/coming-soon-panel";
import {
  QuestionEditorForm,
  type QuestionEditorFormValues,
} from "@/components/screener-editor/question-editor-form";
import { QuestionSourceBadge } from "@/components/screener-editor/question-source-badge";
import { Button } from "@/components/ui/button";
import {
  questionTypeHasOptions,
  screenerQuestionToFormState,
} from "@/lib/screeners/manual-question";
import {
  questionLabel,
  type ScreenerQuestion,
} from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

const PROPERTY_TABS = [
  { id: "question", label: "Question" },
  { id: "logic", label: "Logic" },
  { id: "quotas", label: "Quotas" },
  { id: "validation", label: "Validation" },
] as const;

type PropertyTab = (typeof PROPERTY_TABS)[number]["id"];

export function ScreenerEditorQuestionPropertiesPanel({
  screenerId,
  question,
  onClose,
  onQuestionUpdated,
}: {
  screenerId: string;
  question: ScreenerQuestion;
  onClose: () => void;
  onQuestionUpdated: (question: ScreenerQuestion) => void;
}) {
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<PropertyTab>("question");
  const [values, setValues] = useState<QuestionEditorFormValues>(() =>
    screenerQuestionToFormState(question),
  );

  useEffect(() => {
    setValues(screenerQuestionToFormState(question));
    setActiveTab("question");
  }, [question.id, question.updatedAt]);

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const showOptions = questionTypeHasOptions(values.questionType);

      startTransition(async () => {
        const res = await updateScreenerQuestion({
          screenerId,
          questionId: question.id,
          questionText: values.questionText,
          questionType: values.questionType,
          notes: values.notes,
          answerOptions: showOptions ? values.answerOptions : undefined,
        });

        if (!res.ok) {
          toast.error(res.error);
          return;
        }

        toast.success("Question saved.");
        onQuestionUpdated(res.question);
      });
    },
    [screenerId, question.id, values, onQuestionUpdated],
  );

  const activeLabel =
    PROPERTY_TABS.find((t) => t.id === activeTab)?.label ?? "Question";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {questionLabel(question.position)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <QuestionSourceBadge source={question.source} />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close properties"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Question properties"
        className="flex shrink-0 border-b border-gray-200 dark:border-border"
      >
        {PROPERTY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 border-b-2 px-1 py-2.5 text-[10px] font-semibold transition",
              activeTab === tab.id
                ? "border-blue-600 text-blue-700 dark:border-primary dark:text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "question" ? (
        <form
          id={formId}
          onSubmit={handleSave}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <QuestionEditorForm
              formId={formId}
              values={values}
              onValuesChange={setValues}
              fromLibrary={Boolean(
                question.libraryQuestionId || question.isLocked,
              )}
              disabled={pending}
            />
          </div>
          <div className="shrink-0 border-t border-gray-200 px-4 py-3 dark:border-border">
            <Button
              type="submit"
              disabled={pending}
              className="w-full gap-2"
              size="sm"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <ComingSoonPanel label={activeLabel} />
      )}
    </div>
  );
}
