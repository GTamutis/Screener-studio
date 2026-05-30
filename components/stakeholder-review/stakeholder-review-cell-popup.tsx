"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  clearStakeholderReviewDecision,
  updateStakeholderReviewDecision,
  type StakeholderReviewRecord,
} from "@/app/actions/stakeholder-reviews";
import { StakeholderReviewFloatingPanel } from "@/components/stakeholder-review/stakeholder-review-floating-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StakeholderReviewPersona } from "@/lib/screeners/stakeholder-review/constants";
import {
  SEVERITY_BADGE_CLASSES,
  STAKEHOLDER_PERSONA_LABELS,
} from "@/lib/screeners/stakeholder-review/display";
import type { StakeholderReviewSeverity } from "@/lib/screeners/stakeholder-review/constants";
import { cn } from "@/lib/utils";

export function StakeholderReviewCellPopup({
  open,
  anchorRect,
  persona,
  questionLabel,
  review,
  projectId,
  screenerId,
  onClose,
  onReviewUpdated,
}: {
  open: boolean;
  anchorRect: DOMRect | null;
  persona: StakeholderReviewPersona;
  questionLabel: string;
  review: StakeholderReviewRecord;
  projectId: string;
  screenerId: string;
  onClose: () => void;
  onReviewUpdated: (updated: StakeholderReviewRecord) => void;
}) {
  const [note, setNote] = useState(review.userDecisionNote ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setNote(review.userDecisionNote ?? "");
  }, [review.id, review.userDecisionNote]);

  const severity = review.severity as StakeholderReviewSeverity;
  const personaName = STAKEHOLDER_PERSONA_LABELS[persona];

  const applyDecision = (decision: "implemented" | "dismissed") => {
    startTransition(async () => {
      const res = await updateStakeholderReviewDecision({
        projectId,
        screenerId,
        reviewId: review.id,
        decision,
        note: decision === "implemented" ? note : null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onReviewUpdated({
        ...review,
        userDecision: decision,
        userDecisionNote:
          decision === "implemented" && note.trim() ? note.trim() : null,
      });
      toast.success(
        decision === "implemented" ? "Marked as implemented." : "Dismissed.",
      );
    });
  };

  const handleUndo = () => {
    startTransition(async () => {
      const res = await clearStakeholderReviewDecision({
        projectId,
        screenerId,
        reviewId: review.id,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onReviewUpdated({
        ...review,
        userDecision: null,
        userDecisionNote: null,
      });
      toast.success("Decision cleared.");
    });
  };

  return (
    <StakeholderReviewFloatingPanel
      open={open}
      anchorRect={anchorRect}
      onClose={onClose}
      titleId="stakeholder-feedback-title"
      title={
        <>
          <h3 className="text-sm font-semibold text-foreground">
            {personaName} — {questionLabel}
          </h3>
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              SEVERITY_BADGE_CLASSES[severity],
            )}
          >
            {severity}
          </span>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-foreground">
        {review.feedbackText}
      </p>

      <div className="mt-4 border-t border-border/80 pt-3">
        {review.userDecision ? (
          <div className="space-y-2">
            <p
              className={cn(
                "text-sm font-semibold",
                review.userDecision === "implemented"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {review.userDecision === "implemented"
                ? "Implemented"
                : "Dismissed"}
            </p>
            {review.userDecisionNote ? (
              <p className="text-xs text-muted-foreground">
                {review.userDecisionNote}
              </p>
            ) : null}
            <button
              type="button"
              className="text-xs font-medium text-foreground underline-offset-2 hover:underline disabled:opacity-50"
              disabled={pending}
              onClick={handleUndo}
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="implement-note" className="text-xs text-muted-foreground">
                Optional note (implemented)
              </Label>
              <Input
                id="implement-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you change?"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 w-full"
                disabled={pending}
                onClick={() => applyDecision("implemented")}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Mark as Implemented
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full"
                disabled={pending}
                onClick={() => applyDecision("dismissed")}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </StakeholderReviewFloatingPanel>
  );
}

export function StakeholderReviewNoConcernPopup({
  open,
  anchorRect,
  persona,
  questionLabel,
  onClose,
}: {
  open: boolean;
  anchorRect: DOMRect | null;
  persona: StakeholderReviewPersona;
  questionLabel: string;
  onClose: () => void;
}) {
  return (
    <StakeholderReviewFloatingPanel
      open={open}
      anchorRect={anchorRect}
      onClose={onClose}
      title={
        <h3 className="text-sm font-semibold text-foreground">
          {STAKEHOLDER_PERSONA_LABELS[persona]} — {questionLabel}
        </h3>
      }
    >
      <p className="text-sm text-muted-foreground">
        No concerns identified for this cell.
      </p>
      <span
        className={cn(
          "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
          SEVERITY_BADGE_CLASSES.green,
        )}
      >
        OK
      </span>
    </StakeholderReviewFloatingPanel>
  );
}

export function DecisionOverlay({
  decision,
}: {
  decision: "implemented" | "dismissed" | null;
}) {
  if (!decision) return null;
  if (decision === "implemented") {
    return (
      <span
        className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#6b7280] text-white"
      aria-hidden
    >
      <XCircle className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}
