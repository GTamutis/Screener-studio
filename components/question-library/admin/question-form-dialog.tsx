"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createLibraryQuestion,
  updateLibraryQuestion,
  type QuestionLibraryFormInput,
} from "@/app/actions/question-library-admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ADMIN_FORM_CATEGORIES,
  ADMIN_FORM_QUESTION_TYPES,
  ADMIN_SECTOR_OPTIONS,
  ADMIN_STATUS_OPTIONS,
  dbCategoryToForm,
  questionTypeShowsAnswerOptions,
  sectorsToFormValue,
  type AdminFormCategory,
  type AdminFormQuestionType,
  type AdminQuestionStatus,
  type AdminSectorOption,
} from "@/lib/question-library/admin-constants";
import { QUESTION_TYPE_LABELS } from "@/lib/question-library/constants";
import type { AdminQuestionLibraryItem } from "@/lib/question-library/types";
const selectClassName =
  "glass-input flex h-10 w-full rounded-lg px-3 py-2 text-sm shadow-sm";

function emptyForm(): QuestionLibraryFormInput {
  return {
    questionText: "",
    questionType: "single",
    answerOptionTexts: [""],
    category: "consent",
    sectors: ["All"],
    isLocked: true,
    status: "draft",
    approvedBy: "",
  };
}

function itemToForm(item: AdminQuestionLibraryItem): QuestionLibraryFormInput {
  return {
    questionText: item.questionText,
    questionType: (
      ADMIN_FORM_QUESTION_TYPES.includes(
        item.questionType as AdminFormQuestionType,
      )
        ? item.questionType
        : "single"
    ) as AdminFormQuestionType,
    answerOptionTexts:
      item.answerOptions.length > 0
        ? item.answerOptions.map((o) => o.text)
        : [""],
    category: dbCategoryToForm(item.category),
    sectors: sectorsToFormValue(item.sector),
    isLocked: item.isLocked,
    status: item.status,
    approvedBy: item.approvedBy ?? "",
  };
}

type QuestionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: AdminQuestionLibraryItem | null;
  onSaved: () => void;
};

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  onSaved,
}: QuestionFormDialogProps) {
  const isEdit = Boolean(question);
  const [form, setForm] = useState<QuestionLibraryFormInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setForm(question ? itemToForm(question) : emptyForm());
  }, [open, question]);

  const showOptions = questionTypeShowsAnswerOptions(form.questionType);

  function update<K extends keyof QuestionLibraryFormInput>(
    key: K,
    value: QuestionLibraryFormInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSector(sector: AdminSectorOption, checked: boolean) {
    setForm((prev) => {
      if (sector === "All") {
        return { ...prev, sectors: checked ? ["All"] : [] };
      }
      const withoutAll = prev.sectors.filter((s) => s !== "All");
      const next = checked
        ? [...withoutAll, sector]
        : withoutAll.filter((s) => s !== sector);
      return { ...prev, sectors: next.length ? next : ["All"] };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.status === "archived") {
      const label = question?.displayId ?? "this question";
      if (
        !window.confirm(
          `Archive ${label}? It will be hidden from the public library.`,
        )
      ) {
        return;
      }
    }

    const payload: QuestionLibraryFormInput = {
      ...form,
      approvedBy: form.approvedBy?.trim() || null,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateLibraryQuestion(question!.id, payload)
        : await createLibraryQuestion(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Question updated." : "Question created.");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,800px)] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit question" : "Add question"}
            </DialogTitle>
            <DialogDescription>
              {isEdit && question?.displayId
                ? `ID: ${question.displayId}`
                : "Create a new library entry. Save as draft or approve when ready."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question text</Label>
              <Textarea
                id="question-text"
                value={form.questionText}
                onChange={(e) => update("questionText", e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="question-type">Question type</Label>
                <select
                  id="question-type"
                  className={selectClassName}
                  value={form.questionType}
                  onChange={(e) =>
                    update(
                      "questionType",
                      e.target.value as AdminFormQuestionType,
                    )
                  }
                >
                  {ADMIN_FORM_QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {QUESTION_TYPE_LABELS[type] ?? type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className={selectClassName}
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value as AdminFormCategory)
                  }
                >
                  {ADMIN_FORM_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showOptions ? (
              <div className="space-y-3">
                <Label>Answer options</Label>
                <ul className="space-y-2">
                  {form.answerOptionTexts.map((text, index) => (
                    <li key={index} className="flex gap-2">
                      <Input
                        value={text}
                        onChange={(e) => {
                          const next = [...form.answerOptionTexts];
                          next[index] = e.target.value;
                          update("answerOptionTexts", next);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="glass"
                        size="icon"
                        disabled={form.answerOptionTexts.length <= 1}
                        onClick={() => {
                          update(
                            "answerOptionTexts",
                            form.answerOptionTexts.filter((_, i) => i !== index),
                          );
                        }}
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    update("answerOptionTexts", [...form.answerOptionTexts, ""])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add option
                </Button>
              </div>
            ) : null}

            <div className="space-y-3">
              <Label>Sector</Label>
              <div className="flex flex-wrap gap-4">
                {ADMIN_SECTOR_OPTIONS.map((sector) => (
                  <label
                    key={sector}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={form.sectors.includes(sector)}
                      onCheckedChange={(checked) =>
                        toggleSector(sector, checked === true)
                      }
                    />
                    {sector}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className={selectClassName}
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as AdminQuestionStatus)
                  }
                >
                  {ADMIN_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approved-by">Approved by</Label>
                <Input
                  id="approved-by"
                  value={form.approvedBy ?? ""}
                  onChange={(e) => update("approvedBy", e.target.value)}
                  placeholder="Name or email"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
              <Checkbox
                checked={form.isLocked}
                onCheckedChange={(checked) =>
                  update("isLocked", checked === true)
                }
              />
              <div>
                <p className="text-sm font-medium text-foreground">Locked</p>
                <p className="text-xs text-muted-foreground">
                  Locked questions cannot be edited in screeners without admin
                  override.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="glass"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
