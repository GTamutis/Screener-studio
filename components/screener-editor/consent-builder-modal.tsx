"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { applyConsentBuilderToScreener } from "@/app/actions/screener-questions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CONSENT_BUILDER_GROUPS,
  consentBuilderRowLabel,
  flattenConsentBuilderQuestions,
  groupConsentBuilderQuestions,
  isConsentBuilderLibraryQuestion,
} from "@/lib/question-library/consent-builder";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

function ToggleSwitch({
  checked,
  disabled,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[hsl(var(--dos-navy))]" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function ConsentBuilderRow({
  question,
  checked,
  alreadyInScreener,
  previewOpen,
  toggleDisabled,
  onToggle,
  onPreviewToggle,
}: {
  question: QuestionLibraryItem;
  checked: boolean;
  alreadyInScreener: boolean;
  previewOpen: boolean;
  toggleDisabled: boolean;
  onToggle: (checked: boolean) => void;
  onPreviewToggle: () => void;
}) {
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div className="flex items-start gap-3 px-1 py-2.5">
        <ToggleSwitch
          checked={checked}
          disabled={toggleDisabled}
          onCheckedChange={onToggle}
          ariaLabel={`Include ${question.displayId ?? "question"}`}
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">{consentBuilderRowLabel(question)}</p>
          {alreadyInScreener ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              (already in screener)
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onPreviewToggle}
          className="shrink-0 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Preview
        </button>
      </div>

      {previewOpen ? (
        <div className="mb-2.5 ml-12 mr-1 rounded-md border border-border/80 bg-[hsl(var(--workspace-surface))] px-3 py-2">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
            {question.questionText}
          </p>
          {question.answerOptions.filter((o) => o.text.trim()).length > 0 ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {question.answerOptions
                .filter((o) => o.text.trim())
                .map((option, index) => (
                  <li key={`${question.id}-preview-${index}`}>{option.text}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ConsentBuilderModal({
  open,
  onOpenChange,
  screenerId,
  libraryQuestions,
  screenerQuestions,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenerId: string;
  libraryQuestions: QuestionLibraryItem[];
  screenerQuestions: ScreenerQuestion[];
  onApplied: (questions: ScreenerQuestion[], addedCount: number) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const builderQuestions = useMemo(
    () =>
      flattenConsentBuilderQuestions(
        libraryQuestions.filter(isConsentBuilderLibraryQuestion),
      ),
    [libraryQuestions],
  );

  const grouped = useMemo(
    () => groupConsentBuilderQuestions(builderQuestions),
    [builderQuestions],
  );

  const addedLibraryIds = useMemo(
    () =>
      new Set(
        screenerQuestions
          .map((q) => q.libraryQuestionId)
          .filter((id): id is string => Boolean(id)),
      ),
    [screenerQuestions],
  );

  const selectedOrderedIds = useMemo(() => {
    const selected = selectedIds;
    return builderQuestions
      .filter((q) => selected.has(q.id))
      .map((q) => q.id);
  }, [builderQuestions, selectedIds]);

  const selectedCount = selectedOrderedIds.length;

  useEffect(() => {
    if (!open) return;
    const initial = new Set<string>();
    for (const question of builderQuestions) {
      if (addedLibraryIds.has(question.id)) {
        initial.add(question.id);
      }
    }
    setSelectedIds(initial);
    setPreviewId(null);
  }, [open, builderQuestions, addedLibraryIds]);

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await applyConsentBuilderToScreener({
        screenerId,
        selectedLibraryQuestionIds: selectedOrderedIds,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onApplied(res.questions, res.addedCount);
      onOpenChange(false);
      if (res.addedCount > 0) {
        toast.success(
          `${res.addedCount} question${res.addedCount === 1 ? "" : "s"} added to the beginning of your screener`,
        );
      } else {
        toast.success("Screener intro and consent blocks updated.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] w-[70vw] max-w-[70vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[70vw]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="shrink-0 border-b border-border/80 px-6 py-5 pr-12">
          <DialogTitle className="text-left text-lg font-semibold">
            Consent &amp; Introduction Builder
          </DialogTitle>
          <DialogDescription className="mt-1 text-left text-sm">
            Select the blocks you want to add to your screener. They will be
            inserted at the beginning of the question list.
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {builderQuestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No introduction, disclaimer, or consent questions are available in
              the library.
            </p>
          ) : (
            CONSENT_BUILDER_GROUPS.map(({ key, heading }) => {
              const items = grouped[key];
              if (items.length === 0) return null;

              return (
                <section key={key} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-bold text-foreground">
                    {heading} ({items.length}{" "}
                    {items.length === 1 ? "question" : "questions"})
                  </h3>
                  <div className="mt-2 rounded-lg border border-border/80 bg-[hsl(var(--workspace-panel))] px-3">
                    {items.map((question) => {
                      const alreadyInScreener = addedLibraryIds.has(question.id);
                      const checked = selectedIds.has(question.id);
                      const cannotTurnOff =
                        alreadyInScreener && question.isLocked && checked;

                      return (
                        <ConsentBuilderRow
                          key={question.id}
                          question={question}
                          checked={checked}
                          alreadyInScreener={alreadyInScreener}
                          previewOpen={previewId === question.id}
                          toggleDisabled={cannotTurnOff}
                          onToggle={(next) => {
                            setSelectedIds((prev) => {
                              const copy = new Set(prev);
                              if (next) copy.add(question.id);
                              else copy.delete(question.id);
                              return copy;
                            });
                          }}
                          onPreviewToggle={() =>
                            setPreviewId((current) =>
                              current === question.id ? null : question.id,
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border/80 bg-[hsl(var(--workspace-panel))] px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {selectedCount} question{selectedCount === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || selectedCount === 0}
              onClick={handleConfirm}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                `Add ${selectedCount} to Screener`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
