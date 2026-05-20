"use client";

import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MANUAL_QUESTION_TYPE_OPTIONS,
  questionTypeHasOptions,
  type QuestionOptionFormRow,
} from "@/lib/screeners/manual-question";
import type { QuestionLibraryType } from "@/lib/question-library/types";

export type QuestionEditorFormValues = {
  questionText: string;
  questionType: QuestionLibraryType;
  notes: string;
  answerOptions: QuestionOptionFormRow[];
};

const DEFAULT_OPTION_ROWS: QuestionOptionFormRow[] = [
  { text: "", terminate: false },
  { text: "", terminate: false },
];

export function emptyQuestionEditorValues(): QuestionEditorFormValues {
  return {
    questionText: "",
    questionType: "single",
    notes: "",
    answerOptions: [...DEFAULT_OPTION_ROWS],
  };
}

export function QuestionEditorForm({
  values,
  onValuesChange,
  fromLibrary = false,
  disabled,
  formId: formIdProp,
}: {
  values: QuestionEditorFormValues;
  onValuesChange: (values: QuestionEditorFormValues) => void;
  fromLibrary?: boolean;
  disabled?: boolean;
  formId?: string;
}) {
  const generatedId = useId();
  const formId = formIdProp ?? generatedId;

  const showOptions = questionTypeHasOptions(values.questionType);

  const patch = (partial: Partial<QuestionEditorFormValues>) => {
    onValuesChange({ ...values, ...partial });
  };

  const handleTypeChange = (type: QuestionLibraryType) => {
    const next = { ...values, questionType: type };
    if (questionTypeHasOptions(type) && next.answerOptions.length < 2) {
      next.answerOptions = [...DEFAULT_OPTION_ROWS];
    }
    onValuesChange(next);
  };

  return (
    <div className="space-y-5">
      {fromLibrary ? (
        <p className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
          Changes apply to this screener only. The question library is not
          updated.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-text`}>Question text</Label>
        <Textarea
          id={`${formId}-text`}
          required
          rows={4}
          value={values.questionText}
          onChange={(e) => patch({ questionText: e.target.value })}
          placeholder="Enter the question respondents will see…"
          disabled={disabled}
          maxLength={4000}
          className="min-h-[88px] resize-y text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-type`}>Question type</Label>
        <select
          id={`${formId}-type`}
          value={values.questionType}
          onChange={(e) =>
            handleTypeChange(e.target.value as QuestionLibraryType)
          }
          disabled={disabled}
          className="glass-input flex h-9 w-full rounded-lg px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {MANUAL_QUESTION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {showOptions ? (
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Answer options
          </legend>
          <ul className="space-y-2">
            {values.answerOptions.map((option, index) => (
              <li
                key={index}
                className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-2 dark:border-border dark:bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const answerOptions = values.answerOptions.map((opt, i) =>
                        i === index ? { ...opt, text: e.target.value } : opt,
                      );
                      patch({ answerOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                    disabled={disabled}
                    className="h-8 flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={disabled || values.answerOptions.length <= 2}
                    onClick={() =>
                      patch({
                        answerOptions:
                          values.answerOptions.length <= 2
                            ? values.answerOptions
                            : values.answerOptions.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={option.terminate}
                    onCheckedChange={(checked) => {
                      const answerOptions = values.answerOptions.map((opt, i) =>
                        i === index
                          ? { ...opt, terminate: checked === true }
                          : opt,
                      );
                      patch({ answerOptions });
                    }}
                    disabled={disabled}
                  />
                  Terminates screener
                </label>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={disabled}
            onClick={() =>
              patch({
                answerOptions: [
                  ...values.answerOptions,
                  { text: "", terminate: false },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add option
          </Button>
        </fieldset>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-notes`}>Routing / criteria notes</Label>
        <Textarea
          id={`${formId}-notes`}
          rows={3}
          value={values.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="e.g. CONTINUE, TERMINATE, HOLD instructions for recruiters…"
          disabled={disabled}
          className="resize-y text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Internal guidance for this screener copy (not shown to respondents).
        </p>
      </div>
    </div>
  );
}
