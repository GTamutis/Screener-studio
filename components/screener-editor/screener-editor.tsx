"use client";

import { useCallback, useMemo, useState } from "react";

import { ScreenerEditorCanvas } from "@/components/screener-editor/screener-editor-canvas";
import { ScreenerEditorOutline } from "@/components/screener-editor/screener-editor-outline";
import { ScreenerEditorRightPanel } from "@/components/screener-editor/screener-editor-right-panel";
import { ScreenerEditorToolbar } from "@/components/screener-editor/screener-editor-toolbar";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ProjectSpecs } from "@/lib/projects/project-specs";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import {
  createEmptyAiChatState,
  type ScreenerEditorAiChatState,
  type ScreenerQuestionAddedOptions,
} from "@/lib/screeners/ai-chat/editor-chat-state";
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
  const [rightPanelTab, setRightPanelTab] =
    useState<ScreenerEditorBrowserTab>("specs");
  const [projectSpecs, setProjectSpecs] = useState<ProjectSpecs>(
    screener.projectSpecs,
  );
  const [aiChatState, setAiChatState] = useState<ScreenerEditorAiChatState>(
    createEmptyAiChatState,
  );

  const screenerForPanels: ScreenerWithProject = {
    ...screener,
    projectSpecs,
  };

  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId],
  );

  const handleSelectQuestion = useCallback((id: string) => {
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
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--workspace-surface))]">
      <ScreenerEditorToolbar screener={screener} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ScreenerEditorOutline
          questions={questions}
          markets={screener.markets}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={handleSelectQuestion}
        />
        <ScreenerEditorCanvas
          screener={screener}
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={handleSelectQuestion}
          onDeselectQuestion={handleDeselectQuestion}
          onQuestionAdded={handleQuestionAdded}
          onQuestionsReplaced={handleQuestionsReplaced}
          onOpenAiChat={() => {
            setSelectedQuestionId(null);
            setRightPanelTab("ai");
          }}
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
