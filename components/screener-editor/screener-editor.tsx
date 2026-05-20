"use client";

import { useCallback, useMemo, useState } from "react";

import { ScreenerEditorCanvas } from "@/components/screener-editor/screener-editor-canvas";
import { ScreenerEditorOutline } from "@/components/screener-editor/screener-editor-outline";
import { ScreenerEditorRightPanel } from "@/components/screener-editor/screener-editor-right-panel";
import { ScreenerEditorToolbar } from "@/components/screener-editor/screener-editor-toolbar";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";

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

  const handleQuestionAdded = useCallback((question: ScreenerQuestion) => {
    setQuestions((prev) => [...prev, question]);
    setSelectedQuestionId(question.id);
    requestAnimationFrame(() => {
      document
        .getElementById(`question-${question.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

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
    <div className="flex h-[calc(100dvh)] min-h-0 flex-col overflow-hidden">
      <ScreenerEditorToolbar screener={screener} />
      <div className="flex min-h-0 flex-1">
        <ScreenerEditorOutline
          questions={questions}
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
        />
        <ScreenerEditorRightPanel
          screenerId={screener.id}
          libraryQuestions={libraryQuestions}
          screenerQuestions={questions}
          selectedQuestion={selectedQuestion}
          onQuestionAdded={handleQuestionAdded}
          onQuestionUpdated={handleQuestionUpdated}
          onDeselectQuestion={handleDeselectQuestion}
        />
      </div>
    </div>
  );
}
