"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getStakeholderReviewPageData,
  getStakeholderReviewPollState,
  type StakeholderReviewPageData,
  type StakeholderReviewStatus,
} from "@/app/actions/stakeholder-reviews";
import { StakeholderReviewMatrix } from "@/components/stakeholder-review/stakeholder-review-matrix";
import { Button } from "@/components/ui/button";
import { formatStakeholderReviewDate } from "@/lib/screeners/stakeholder-review/display";
import { cn } from "@/lib/utils";

const POLL_MS = 3000;

export function StakeholderReviewPage({
  initialData,
  variant = "full",
}: {
  initialData: StakeholderReviewPageData;
  variant?: "full" | "popup";
}) {
  const isPopup = variant === "popup";
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [reviews, setReviews] = useState(initialData.reviews);
  const [questions, setQuestions] = useState(initialData.questions);
  const [running, setRunning] = useState(
    initialData.reviewStatus === "running",
  );
  const [failedMessage, setFailedMessage] = useState<string | null>(
    initialData.reviewStatus === "failed"
      ? "The review could not be completed. Please try again."
      : null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const postInFlightRef = useRef(false);

  const editorHref = `/workspace/screener-studio/${data.screenerId}`;
  const projectHref = `/dashboard/projects/${data.projectId}`;
  const hasReview =
    data.reviewStatus === "complete" || reviews.length > 0;
  const showMatrix = data.reviewStatus === "complete";

  const refreshPageData = useCallback(async () => {
    const result = await getStakeholderReviewPageData(
      data.projectId,
      data.screenerId,
    );
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setData(result);
    setReviews(result.reviews);
    setQuestions(result.questions);
    setRunning(result.reviewStatus === "running");
    if (result.reviewStatus === "failed") {
      setFailedMessage(
        "The review could not be completed. Please try again.",
      );
    } else {
      setFailedMessage(null);
    }
    router.refresh();
  }, [data.projectId, data.screenerId, router]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const poll = await getStakeholderReviewPollState(
        data.projectId,
        data.screenerId,
      );
      if ("error" in poll) return;

      setData((prev) => ({
        ...prev,
        reviewStatus: poll.reviewStatus,
        lastReviewedAt: poll.lastReviewedAt ?? prev.lastReviewedAt,
      }));

      if (poll.reviewStatus === "running") {
        setRunning(true);
        return;
      }

      stopPolling();
      setRunning(false);

      if (poll.reviewStatus === "complete") {
        setFailedMessage(null);
        if (!postInFlightRef.current) {
          await refreshPageData();
        }
      } else if (poll.reviewStatus === "failed") {
        setFailedMessage(
          "The review could not be completed. Please try again.",
        );
      }
    }, POLL_MS);
  }, [data.projectId, data.screenerId, refreshPageData, stopPolling]);

  useEffect(() => {
    if (data.reviewStatus === "running") {
      setRunning(true);
      startPolling();
    }
    return () => stopPolling();
  }, [data.reviewStatus, startPolling, stopPolling]);

  const runReview = async () => {
    setRunning(true);
    setFailedMessage(null);
    setData((prev) => ({ ...prev, reviewStatus: "running" }));
    startPolling();
    postInFlightRef.current = true;

    try {
      const response = await fetch("/api/stakeholder-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenerId: data.screenerId }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        status?: string;
        summary?: { total_issues?: number };
      } | null;

      if (!response.ok) {
        const message =
          payload?.error ?? "Stakeholder review failed. Please try again.";
        setFailedMessage(message);
        setData((prev) => ({ ...prev, reviewStatus: "failed" }));
        setRunning(false);
        stopPolling();
        toast.error(message);
        return;
      }

      setData((prev) => ({
        ...prev,
        reviewStatus: "complete" as StakeholderReviewStatus,
      }));
      setFailedMessage(null);
      await refreshPageData();
      toast.success(
        `Review complete — ${payload?.summary?.total_issues ?? 0} issue${(payload?.summary?.total_issues ?? 0) === 1 ? "" : "s"} recorded.`,
      );
    } catch {
      setFailedMessage("Network error. Please try again.");
      setData((prev) => ({ ...prev, reviewStatus: "failed" }));
      toast.error("Network error. Please try again.");
    } finally {
      postInFlightRef.current = false;
      setRunning(false);
      stopPolling();
    }
  };

  const statusLine = () => {
    if (running || data.reviewStatus === "running") {
      return (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--dos-blue))]" />
          Reviewing…
        </span>
      );
    }
    if (data.reviewStatus === "complete" && data.lastReviewedAt) {
      return (
        <span className="text-sm text-muted-foreground">
          Last reviewed: {formatStakeholderReviewDate(data.lastReviewedAt)}
        </span>
      );
    }
    return null;
  };

  const actionButtons = (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 border-border/80 bg-[hsl(var(--workspace-panel))]"
        asChild
      >
        <a href={editorHref} target="_blank" rel="noopener noreferrer">
          Open screener editor
        </a>
      </Button>
      <Button
        type="button"
        disabled={running}
        onClick={runReview}
        className="min-w-[140px]"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reviewing…
          </>
        ) : hasReview ? (
          "Re-run Review"
        ) : (
          "Run Review"
        )}
      </Button>
      {statusLine()}
    </div>
  );

  return (
    <div
      className={cn(
        "stakeholder-review-page",
        isPopup ? "space-y-5" : "space-y-8",
      )}
    >
      {isPopup ? (
        <header className="flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Stakeholder review
            </p>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-foreground">
              {data.screenerName}
            </h1>
            <p className="text-sm text-muted-foreground">{data.projectName}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Green = no issue. Amber = minor concern. Red = significant issue.
              Click a cell for full feedback.
            </p>
            {hasReview && data.lastReviewedAt && !running ? (
              <p className="text-xs text-muted-foreground">
                Last run: {formatStakeholderReviewDate(data.lastReviewedAt)}
              </p>
            ) : null}
          </div>
          {actionButtons}
        </header>
      ) : (
        <>
          <p className="text-xs font-medium text-muted-foreground">
            Open beside your screener editor to implement feedback side by side.
          </p>

          <nav
            className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href={projectHref}
              className="font-medium transition hover:text-foreground"
            >
              {data.projectName}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            <a
              href={editorHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition hover:text-foreground"
            >
              {data.screenerName}
            </a>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            <span className="font-semibold text-foreground">
              Stakeholder Review
            </span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                AI Stakeholder Panel Review
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This panel simulates review feedback from four professional
                perspectives. Green = no issue. Amber = minor concern. Red =
                significant issue. Click any cell to read the full feedback.
              </p>
              {hasReview && data.lastReviewedAt && !running ? (
                <p className="text-xs text-muted-foreground">
                  Last run: {formatStakeholderReviewDate(data.lastReviewedAt)}
                </p>
              ) : null}
            </div>
            {actionButtons}
          </div>
        </>
      )}

      {failedMessage ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm text-destructive">{failedMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={runReview}
            disabled={running}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {showMatrix ? (
        <StakeholderReviewMatrix
          questions={questions}
          reviews={reviews}
          projectId={data.projectId}
          screenerId={data.screenerId}
          editorHref={editorHref}
          onReviewsChange={setReviews}
          onQuestionsChange={setQuestions}
        />
      ) : (
        <div
          className={cn(
            "sr-empty-state rounded-lg border border-dashed px-6 py-16 text-center",
            running && "opacity-60",
          )}
        >
          {running ? (
            <p className="text-sm text-muted-foreground">
              Running stakeholder panel review… This may take a minute.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hasReview
                ? "No feedback rows were saved. Try running the review again."
                : "Run a review to generate the feedback matrix."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
