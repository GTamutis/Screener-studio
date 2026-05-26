"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updateScreenerQuestion } from "@/app/actions/screener-questions";
import { QuestionLogicForm } from "@/components/screener-editor/question-logic-form";
import { QuestionQuotasForm } from "@/components/screener-editor/question-quotas-form";
import {
  QuestionEditorForm,
  type QuestionEditorFormValues,
} from "@/components/screener-editor/question-editor-form";
import { QuestionSourceBadge } from "@/components/screener-editor/question-source-badge";
import { Button } from "@/components/ui/button";
import {
  countQuotaOptions,
  screenerQuestionToQuotaFormState,
  type ScreenerQuestionQuotaConfig,
} from "@/lib/screeners/question-quotas";
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
] as const;

type PropertyTab = (typeof PROPERTY_TABS)[number]["id"];

export type ScreenerQuestionPropertiesDraft = {
  values: QuestionEditorFormValues;
  quotaConfig: ScreenerQuestionQuotaConfig;
};

export function ScreenerEditorQuestionPropertiesPanel({
  formId,
  screenerId,
  markets,
  question,
  draft,
  onClose,
  onBackToAiChat,
  onDraftChange,
  onQuestionUpdated,
}: {
  formId?: string;
  screenerId: string;
  markets: string[];
  question: ScreenerQuestion;
  draft?: ScreenerQuestionPropertiesDraft;
  onClose: () => void;
  onBackToAiChat?: () => void;
  onDraftChange: (
    questionId: string,
    draft: ScreenerQuestionPropertiesDraft,
  ) => void;
  onQuestionUpdated: (question: ScreenerQuestion) => void;
}) {
  const generatedFormId = useId();
  const resolvedFormId = formId ?? generatedFormId;
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<PropertyTab>("question");
  const [values, setValues] = useState<QuestionEditorFormValues>(() =>
    draft?.values ?? screenerQuestionToFormState(question),
  );
  const [quotaConfig, setQuotaConfig] = useState<ScreenerQuestionQuotaConfig>(
    () => draft?.quotaConfig ?? screenerQuestionToQuotaFormState(question),
  );

  useEffect(() => {
    setValues(draft?.values ?? screenerQuestionToFormState(question));
    setQuotaConfig(
      draft?.quotaConfig ?? screenerQuestionToQuotaFormState(question),
    );
    setActiveTab("question");
    // Reset panel when the selected question/server snapshot changes; draft is
    // intentionally sampled only on that transition to avoid tab resets per key.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- question identity + updatedAt
  }, [question.id, question.updatedAt]);

  const updateDraft = useCallback(
    (
      nextValues: QuestionEditorFormValues,
      nextQuotaConfig: ScreenerQuestionQuotaConfig,
    ) => {
      onDraftChange(question.id, {
        values: nextValues,
        quotaConfig: nextQuotaConfig,
      });
    },
    [onDraftChange, question.id],
  );

  const updateValues = useCallback(
    (nextValues: QuestionEditorFormValues) => {
      setValues(nextValues);
      updateDraft(nextValues, quotaConfig);
    },
    [quotaConfig, updateDraft],
  );

  const updateQuotaConfig = useCallback(
    (nextQuotaConfig: ScreenerQuestionQuotaConfig) => {
      setQuotaConfig(nextQuotaConfig);
      updateDraft(values, nextQuotaConfig);
    },
    [updateDraft, values],
  );

  useEffect(() => {
    const optionCount = countQuotaOptions(values.answerOptions);
    if (quotaConfig.optionTargets.length === optionCount) return;
    const nextQuotaConfig = {
      ...quotaConfig,
      optionTargets: Array.from({ length: optionCount }, (_, i) => {
        return quotaConfig.optionTargets[i] ?? {};
      }),
    };
    setQuotaConfig(nextQuotaConfig);
    updateDraft(values, nextQuotaConfig);
  }, [quotaConfig, updateDraft, values]);

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (pending) return;
      const showOptions = questionTypeHasOptions(values.questionType);

      startTransition(async () => {
        const res = await updateScreenerQuestion({
          screenerId,
          questionId: question.id,
          questionText: values.questionText,
          questionType: values.questionType,
          notes: values.notes,
          answerOptions: showOptions ? values.answerOptions : undefined,
          quotaConfig,
        });

        if (!res.ok) {
          toast.error(res.error);
          return;
        }

        toast.success("Question saved.");
        onQuestionUpdated(res.question);
      });
    },
    [pending, screenerId, question.id, values, quotaConfig, onQuestionUpdated],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/80 px-4 py-3">
        {onBackToAiChat ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 h-8 gap-1.5 px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={onBackToAiChat}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to AI Chat
          </Button>
        ) : null}
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
        className="flex shrink-0 border-b border-border/80"
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

      <form
        id={resolvedFormId}
        onSubmit={handleSave}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {activeTab === "question" ? (
            <QuestionEditorForm
              formId={resolvedFormId}
              values={values}
              onValuesChange={updateValues}
              fromLibrary={Boolean(
                question.libraryQuestionId || question.isLocked,
              )}
              disabled={pending}
            />
          ) : null}
          {activeTab === "logic" ? (
            <QuestionLogicForm
              formId={resolvedFormId}
              questionType={values.questionType}
              answerOptions={values.answerOptions}
              onAnswerOptionsChange={(answerOptions) =>
                updateValues({ ...values, answerOptions })
              }
              notes={values.notes}
              onNotesChange={(notes) => updateValues({ ...values, notes })}
              disabled={pending}
            />
          ) : null}
          {activeTab === "quotas" ? (
            <QuestionQuotasForm
              markets={markets}
              answerOptions={values.answerOptions}
              quotaConfig={quotaConfig}
              onQuotaConfigChange={updateQuotaConfig}
              disabled={pending}
            />
          ) : null}
        </div>
        <div className="shrink-0 border-t border-border/80 px-4 py-3">
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
    </div>
  );
}
