"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { updateScreenerQuestionTextQuick } from "@/app/actions/screener-questions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { previewQuestionWords } from "@/lib/screeners/stakeholder-review/display";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function MatrixQuestionCell({
  label,
  question,
  screenerId,
  editorHref,
  onQuestionUpdated,
}: {
  label: string;
  question: ScreenerQuestion | null;
  screenerId: string;
  editorHref: string;
  onQuestionUpdated?: (question: ScreenerQuestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  if (!question) {
    return (
      <div>
        <span className="font-semibold text-foreground">{label}</span>
        <span className="sr-question-preview mt-0.5 block text-xs">
          Screener-wide feedback
        </span>
      </div>
    );
  }

  const fullText = question.questionText;
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  const isTruncated = wordCount > 6;
  const preview = previewQuestionWords(fullText);

  const startEdit = () => {
    setDraft(fullText);
    setEditing(true);
    setExpanded(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(fullText);
  };

  const saveEdit = () => {
    startTransition(async () => {
      const res = await updateScreenerQuestionTextQuick({
        screenerId,
        questionId: question.id,
        questionText: draft,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onQuestionUpdated?.(res.question);
      setEditing(false);
      toast.success("Question text updated.");
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1">
        {isTruncated ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 rounded p-0.5 text-foreground hover:bg-muted"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse question" : "Expand question"}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{label}</span>
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Quick edit question wording"
              >
                <Pencil className="h-3 w-3" />
                Quick edit
              </button>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="text-xs"
                disabled={pending}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={pending}
                  onClick={saveEdit}
                >
                  {pending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 border-border/80 text-xs"
                  disabled={pending}
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                For answer options, quotas, or logic, use the{" "}
                <Link
                  href={editorHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline"
                >
                  screener editor
                  <ExternalLink className="ml-0.5 inline h-3 w-3" />
                </Link>
                .
              </p>
            </div>
          ) : (
            <p
              className={cn(
                "sr-question-preview mt-0.5 text-xs leading-relaxed",
                expanded ? "whitespace-pre-wrap" : "",
              )}
            >
              {expanded || !isTruncated ? fullText : preview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
