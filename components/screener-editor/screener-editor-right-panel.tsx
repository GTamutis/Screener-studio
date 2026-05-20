"use client";

import { useState } from "react";

import { ComingSoonPanel } from "@/components/screener-editor/coming-soon-panel";
import { ScreenerEditorLibraryPanel } from "@/components/screener-editor/screener-editor-library-panel";
import { ScreenerEditorQuestionPropertiesPanel } from "@/components/screener-editor/screener-editor-question-properties-panel";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

const BROWSER_TABS = [
  { id: "library", label: "Library" },
  { id: "ai", label: "AI Chat" },
  { id: "search", label: "Search" },
] as const;

type BrowserTab = (typeof BROWSER_TABS)[number]["id"];

export function ScreenerEditorRightPanel({
  screenerId,
  libraryQuestions,
  screenerQuestions,
  selectedQuestion,
  onQuestionAdded,
  onQuestionUpdated,
  onDeselectQuestion,
}: {
  screenerId: string;
  libraryQuestions: QuestionLibraryItem[];
  screenerQuestions: ScreenerQuestion[];
  selectedQuestion: ScreenerQuestion | null;
  onQuestionAdded: (question: ScreenerQuestion) => void;
  onQuestionUpdated: (question: ScreenerQuestion) => void;
  onDeselectQuestion: () => void;
}) {
  const [browserTab, setBrowserTab] = useState<BrowserTab>("library");

  if (selectedQuestion) {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-gray-200 bg-white dark:border-border dark:bg-card">
        <ScreenerEditorQuestionPropertiesPanel
          screenerId={screenerId}
          question={selectedQuestion}
          onClose={onDeselectQuestion}
          onQuestionUpdated={onQuestionUpdated}
        />
      </aside>
    );
  }

  const activeLabel =
    BROWSER_TABS.find((t) => t.id === browserTab)?.label ?? "Library";

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-gray-200 bg-white dark:border-border dark:bg-card">
      <div
        role="tablist"
        aria-label="Editor tools"
        className="flex shrink-0 border-b border-gray-200 dark:border-border"
      >
        {BROWSER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={browserTab === tab.id}
            onClick={() => setBrowserTab(tab.id)}
            className={cn(
              "flex-1 border-b-2 px-2 py-3 text-xs font-semibold transition",
              browserTab === tab.id
                ? "border-blue-600 text-blue-700 dark:border-primary dark:text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="flex min-h-0 flex-1 flex-col">
        {browserTab === "library" ? (
          <ScreenerEditorLibraryPanel
            screenerId={screenerId}
            libraryQuestions={libraryQuestions}
            screenerQuestions={screenerQuestions}
            onQuestionAdded={onQuestionAdded}
          />
        ) : (
          <ComingSoonPanel label={activeLabel} />
        )}
      </div>
    </aside>
  );
}
