"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { addManualScreenerQuestion } from "@/app/actions/screener-questions";
import {
  emptyQuestionEditorValues,
  QuestionEditorForm,
  type QuestionEditorFormValues,
} from "@/components/screener-editor/question-editor-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { questionTypeHasOptions } from "@/lib/screeners/manual-question";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function AddManualQuestionSheet({
  screenerId,
  open,
  onOpenChange,
  onQuestionAdded,
}: {
  screenerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestionAdded: (question: ScreenerQuestion) => void;
}) {
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<QuestionEditorFormValues>(
    emptyQuestionEditorValues,
  );

  useEffect(() => {
    if (open) setValues(emptyQuestionEditorValues());
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const showOptions = questionTypeHasOptions(values.questionType);

    startTransition(async () => {
      const res = await addManualScreenerQuestion({
        screenerId,
        questionText: values.questionText,
        questionType: values.questionType,
        answerOptions: showOptions ? values.answerOptions : undefined,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Question added.");
      onQuestionAdded(res.question);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "fixed inset-y-0 right-0 left-auto top-0 flex h-full w-full max-w-md flex-col gap-0 rounded-none border-l p-0 shadow-xl",
          "translate-x-0 translate-y-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          "data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5 text-left">
          <DialogTitle>Add manual question</DialogTitle>
          <DialogDescription>
            Write your question, choose a type, and add answer options where
            needed.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <QuestionEditorForm
              formId={formId}
              values={values}
              onValuesChange={setValues}
              disabled={pending}
            />
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save question
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
