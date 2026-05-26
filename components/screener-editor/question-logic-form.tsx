"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  questionTypeHasOptions,
  type QuestionOptionFormRow,
} from "@/lib/screeners/manual-question";
import type { QuestionLibraryType } from "@/lib/question-library/types";

export function QuestionLogicForm({
  questionType,
  answerOptions,
  onAnswerOptionsChange,
  notes,
  onNotesChange,
  formId,
  disabled,
}: {
  questionType: QuestionLibraryType;
  answerOptions: QuestionOptionFormRow[];
  onAnswerOptionsChange: (options: QuestionOptionFormRow[]) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  formId: string;
  disabled?: boolean;
}) {
  const showPerOptionLogic = questionTypeHasOptions(questionType);
  const filledOptions = answerOptions.filter((o) => o.text.trim().length > 0);

  const patchOption = (
    index: number,
    partial: Partial<QuestionOptionFormRow>,
  ) => {
    onAnswerOptionsChange(
      answerOptions.map((opt, i) =>
        i === index ? { ...opt, ...partial } : opt,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {showPerOptionLogic ? (
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold text-foreground">
              Logic per answer option
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Add recruiter instructions for each choice (e.g. market, hold, or
              close-out). Terminate is set on the Question tab.
            </p>
          </div>

          {filledOptions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/80 px-3 py-4 text-xs text-muted-foreground">
              Add answer options on the Question tab first, then set logic here.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-border/80">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    <th className="px-2 py-2 font-semibold text-muted-foreground">
                      Option
                    </th>
                    <th className="px-2 py-2 font-semibold text-muted-foreground">
                      Logic note
                    </th>
                    <th className="w-24 px-2 py-2 text-right font-semibold text-muted-foreground">
                      Criteria
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {answerOptions.map((option, index) => {
                    if (!option.text.trim()) return null;
                    return (
                      <tr
                        key={index}
                        className="border-b border-border/60 align-top last:border-b-0"
                      >
                        <td className="px-2 py-2 font-medium text-foreground">
                          {option.text}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            value={option.logicNote}
                            onChange={(e) =>
                              patchOption(index, { logicNote: e.target.value })
                            }
                            placeholder="e.g. US only · Closing in DE"
                            disabled={disabled}
                            className="h-8 text-xs"
                            aria-label={`Logic note for ${option.text}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          {option.terminate ? (
                            <span className="font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                              Terminate
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-border/80 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
          Per-option logic applies to single- and multiple-choice questions.
          Use recruiting notes below for other question types.
        </p>
      )}

      <div className="space-y-2 border-t border-border/60 pt-5">
        <Label
          htmlFor={`${formId}-recruiting-notes`}
          className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80"
        >
          Recruiting notes
        </Label>
        <Textarea
          id={`${formId}-recruiting-notes`}
          rows={5}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Routing / criteria for recruiters — CONTINUE, TERMINATE, HOLD, market-specific guidance…"
          disabled={disabled}
          className="resize-y border-border/60 bg-muted/25 font-serif text-sm italic leading-relaxed text-muted-foreground shadow-none placeholder:text-muted-foreground/50 placeholder:not-italic"
        />
        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          Internal guidance for this screener copy. Not shown to respondents and
          separate from the question wording above.
        </p>
      </div>
    </div>
  );
}
