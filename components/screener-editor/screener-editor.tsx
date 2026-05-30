"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ScreenerEditorCanvas } from "@/components/screener-editor/screener-editor-canvas";
import { ScreenerEditorOutline } from "@/components/screener-editor/screener-editor-outline";
import { ScreenerEditorRightPanel } from "@/components/screener-editor/screener-editor-right-panel";
import { ConsentBuilderModal } from "@/components/screener-editor/consent-builder-modal";
import { ScreenerEditorToolbar } from "@/components/screener-editor/screener-editor-toolbar";
import { QualityReviewPanel } from "@/components/screener-editor/quality-review-panel";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import { consentBuilderLibraryQuestionIds } from "@/lib/question-library/consent-builder";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ProjectSpecs } from "@/lib/projects/project-specs";
import type { ScreenerVersionSnapshot } from "@/app/actions/screeners";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import {
  createEmptyAiChatState,
  type ScreenerEditorAiChatState,
  type ScreenerQuestionAddedOptions,
} from "@/lib/screeners/ai-chat/editor-chat-state";
import { buildProjectBrief } from "@/lib/screeners/ai-chat/project-brief";
import { serializeQuestionsForQualityReview } from "@/lib/screeners/quality-review/questions-payload";
import type {
  DismissedQualityReviewIssue,
  QualityReviewResult,
} from "@/lib/screeners/quality-review/types";
import {
  type ScreenerEditorBrowserTab,
} from "@/components/screener-editor/screener-editor-right-panel";

export function ScreenerEditor({
  screener,
  initialQuestions,
  libraryQuestions,
}: {
  screener: ScreenerWithProject;
  initialQuestions: ScreenerQuestion[];
  libraryQuestions: QuestionLibraryItem[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<
    string | null
  >(null);
  const [rightPanelTab, setRightPanelTab] =
    useState<ScreenerEditorBrowserTab>("specs");
  const [projectSpecs, setProjectSpecs] = useState<ProjectSpecs>(
    screener.projectSpecs,
  );
  const [aiChatState, setAiChatState] = useState<ScreenerEditorAiChatState>(
    createEmptyAiChatState,
  );

  const [qualityReviewOpen, setQualityReviewOpen] = useState(false);
  const [qualityReviewLoading, setQualityReviewLoading] = useState(false);
  const [qualityReviewResult, setQualityReviewResult] =
    useState<QualityReviewResult | null>(null);
  const [dismissedQualityIssues, setDismissedQualityIssues] = useState<
    DismissedQualityReviewIssue[]
  >([]);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [consentBuilderOpen, setConsentBuilderOpen] = useState(false);
  const [versionMeta, setVersionMeta] = useState<ScreenerVersionSnapshot>({
    status: screener.status,
    majorVersion: screener.majorVersion,
    minorVersion: screener.minorVersion,
    updatedAt: screener.updatedAt,
  });

  const screenerForToolbar = useMemo<ScreenerWithProject>(
    () => ({
      ...screener,
      ...versionMeta,
    }),
    [screener, versionMeta],
  );

  const handleScreenerVersionChange = useCallback(
    (snapshot: ScreenerVersionSnapshot) => {
      setVersionMeta(snapshot);
    },
    [],
  );

  const qualityReviewAbortRef = useRef<AbortController | null>(null);
  const qualityReviewStopRequestedRef = useRef(false);

  const screenerForPanels = useMemo<ScreenerWithProject>(
    () => ({
      ...screener,
      projectSpecs,
    }),
    [screener, projectSpecs],
  );

  const projectBrief = useMemo(
    () => buildProjectBrief(screenerForPanels),
    [screenerForPanels],
  );

  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId],
  );

  const handleSelectQuestion = useCallback((id: string) => {
    setHighlightedQuestionId(null);
    setSelectedQuestionId((current) => {
      const next = current === id ? null : id;
      if (next) {
        requestAnimationFrame(() => {
          document
            .getElementById(`question-${id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
      return next;
    });
  }, []);

  const handleDeselectQuestion = useCallback(() => {
    setSelectedQuestionId(null);
    setHighlightedQuestionId(null);
  }, []);

  const handleQuestionAdded = useCallback(
    (question: ScreenerQuestion, options?: ScreenerQuestionAddedOptions) => {
      setQuestions((prev) => [...prev, question]);
      if (options?.select === false) {
        requestAnimationFrame(() => {
          document
            .getElementById(`question-${question.id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        return;
      }
      setSelectedQuestionId(question.id);
      requestAnimationFrame(() => {
        document
          .getElementById(`question-${question.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [],
  );

  const handleQuestionUpdated = useCallback((question: ScreenerQuestion) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? question : q)),
    );
  }, []);

  const handleQuestionsReplaced = useCallback((next: ScreenerQuestion[]) => {
    setQuestions(next);
    setSelectedQuestionId((current) => {
      if (current && next.some((q) => q.id === current)) return current;
      return null;
    });
    setHighlightedQuestionId((current) => {
      if (current && next.some((q) => q.id === current)) return current;
      return null;
    });
  }, []);

  const consentPoolLibraryIds = useMemo(
    () => consentBuilderLibraryQuestionIds(libraryQuestions),
    [libraryQuestions],
  );

  const handleConsentBuilderApplied = useCallback(
    (next: ScreenerQuestion[]) => {
      handleQuestionsReplaced(next);
      setSelectedQuestionId(null);
      setHighlightedQuestionId(null);
      requestAnimationFrame(() => {
        document
          .getElementById("screener-canvas-scroll")
          ?.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [handleQuestionsReplaced],
  );

  const stopQualityReview = useCallback(() => {
    qualityReviewStopRequestedRef.current = true;
    qualityReviewAbortRef.current?.abort();
  }, []);

  const runQualityReview = useCallback(async () => {
    qualityReviewAbortRef.current?.abort();
    qualityReviewStopRequestedRef.current = false;

    const controller = new AbortController();
    qualityReviewAbortRef.current = controller;

    setQualityReviewOpen(true);
    setQualityReviewLoading(true);

    try {
      const res = await fetch("/api/quality-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          projectBrief,
          questions: serializeQuestionsForQualityReview(questions),
        }),
      });

      if (controller.signal.aborted) return;

      const data = (await res.json()) as QualityReviewResult & {
        error?: string;
      };

      if (controller.signal.aborted) return;

      if (!res.ok) {
        if (res.status === 499) return;
        toast.error(data.error ?? "Quality review failed.");
        return;
      }

      setQualityReviewResult(data);
      setDismissedQualityIssues([]);
      toast.success("Quality review complete.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (qualityReviewStopRequestedRef.current) {
          toast.message("Quality review cancelled.");
        }
        return;
      }
      toast.error("Quality review failed. Please try again.");
    } finally {
      if (qualityReviewAbortRef.current === controller) {
        setQualityReviewLoading(false);
        qualityReviewAbortRef.current = null;
      }
      qualityReviewStopRequestedRef.current = false;
    }
  }, [projectBrief, questions]);

  const handleQualityReviewToolbarClick = useCallback(() => {
    if (qualityReviewResult && !qualityReviewOpen) {
      setQualityReviewOpen(true);
      return;
    }
    void runQualityReview();
  }, [qualityReviewOpen, qualityReviewResult, runQualityReview]);

  const handleGoToQuestionFromReview = useCallback((questionId: string) => {
    setSelectedQuestionId(questionId);
    setHighlightedQuestionId(questionId);
    requestAnimationFrame(() => {
      document
        .getElementById(`question-${questionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const handleDismissQualityIssue = useCallback(
    (issueId: string, reason: string) => {
      setDismissedQualityIssues((prev) => [
        ...prev,
        {
          issueId,
          reason,
          dismissedAt: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--workspace-surface))]">
      <ScreenerEditorToolbar
        screener={screenerForToolbar}
        onScreenerVersionChange={handleScreenerVersionChange}
        qualityReviewLoading={qualityReviewLoading}
        onRunQualityReview={handleQualityReviewToolbarClick}
        onStopQualityReview={stopQualityReview}
        onOpenConsentBuilder={() => setConsentBuilderOpen(true)}
      />
      <ConsentBuilderModal
        open={consentBuilderOpen}
        onOpenChange={setConsentBuilderOpen}
        screenerId={screener.id}
        libraryQuestions={libraryQuestions}
        screenerQuestions={questions}
        onApplied={handleConsentBuilderApplied}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ScreenerEditorOutline
          questions={questions}
          markets={screener.markets}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={handleSelectQuestion}
          onCollapsedChange={setOutlineCollapsed}
        />
        <ScreenerEditorCanvas
          screener={screener}
          questions={questions}
          consentPoolLibraryIds={consentPoolLibraryIds}
          selectedQuestionId={selectedQuestionId}
          highlightedQuestionId={highlightedQuestionId}
          onSelectQuestion={handleSelectQuestion}
          onDeselectQuestion={handleDeselectQuestion}
          onQuestionAdded={handleQuestionAdded}
          onQuestionsReplaced={handleQuestionsReplaced}
          onOpenAiChat={() => {
            setSelectedQuestionId(null);
            setRightPanelTab("ai");
          }}
        />
        <QualityReviewPanel
          open={qualityReviewOpen}
          onClose={() => setQualityReviewOpen(false)}
          loading={qualityReviewLoading}
          result={qualityReviewResult}
          questions={questions}
          dismissedIssues={dismissedQualityIssues}
          onDismissIssue={handleDismissQualityIssue}
          onGoToQuestion={handleGoToQuestionFromReview}
          onRerun={runQualityReview}
          onStop={stopQualityReview}
          outlineCollapsed={outlineCollapsed}
        />
        <ScreenerEditorRightPanel
          screener={screenerForPanels}
          projectSpecs={projectSpecs}
          onProjectSpecsChange={setProjectSpecs}
          libraryQuestions={libraryQuestions}
          screenerQuestions={questions}
          selectedQuestion={selectedQuestion}
          browserTab={rightPanelTab}
          onBrowserTabChange={setRightPanelTab}
          aiChatState={aiChatState}
          onAiChatStateChange={setAiChatState}
          onQuestionAdded={handleQuestionAdded}
          onQuestionUpdated={handleQuestionUpdated}
          onDeselectQuestion={handleDeselectQuestion}
        />
      </div>
    </div>
  );
}
