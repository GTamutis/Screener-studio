"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import { ScreenerEditorAiChatPanel } from "@/components/screener-editor/screener-editor-ai-chat-panel";
import { ScreenerEditorLibraryPanel } from "@/components/screener-editor/screener-editor-library-panel";
import { ScreenerEditorProjectSpecsPanel } from "@/components/screener-editor/screener-editor-project-specs-panel";
import { ScreenerEditorQuestionPropertiesPanel } from "@/components/screener-editor/screener-editor-question-properties-panel";
import type { QuestionLibraryItem } from "@/lib/question-library/types";
import type { ProjectSpecs } from "@/lib/projects/project-specs";
import type { ScreenerEditorAiChatState } from "@/lib/screeners/ai-chat/editor-chat-state";
import type { ScreenerQuestionAddedOptions } from "@/lib/screeners/ai-chat/editor-chat-state";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import { cn } from "@/lib/utils";

export const BROWSER_TABS = [
  { id: "specs", label: "Project specs" },
  { id: "library", label: "Question library" },
  { id: "ai", label: "AI Chat" },
] as const;

export type ScreenerEditorBrowserTab = (typeof BROWSER_TABS)[number]["id"];

export function ScreenerEditorRightPanel({
  screener,
  projectSpecs,
  onProjectSpecsChange,
  libraryQuestions,
  screenerQuestions,
  selectedQuestion,
  browserTab: browserTabProp,
  onBrowserTabChange,
  aiChatState,
  onAiChatStateChange,
  onQuestionAdded,
  onQuestionUpdated,
  onDeselectQuestion,
}: {
  screener: ScreenerWithProject;
  projectSpecs: ProjectSpecs;
  onProjectSpecsChange: (specs: ProjectSpecs) => void;
  libraryQuestions: QuestionLibraryItem[];
  screenerQuestions: ScreenerQuestion[];
  selectedQuestion: ScreenerQuestion | null;
  browserTab?: ScreenerEditorBrowserTab;
  onBrowserTabChange?: (tab: ScreenerEditorBrowserTab) => void;
  aiChatState: ScreenerEditorAiChatState;
  onAiChatStateChange: Dispatch<SetStateAction<ScreenerEditorAiChatState>>;
  onQuestionAdded: (
    question: ScreenerQuestion,
    options?: ScreenerQuestionAddedOptions,
  ) => void;
  onQuestionUpdated: (question: ScreenerQuestion) => void;
  onDeselectQuestion: () => void;
}) {
  const [browserTabInternal, setBrowserTabInternal] =
    useState<ScreenerEditorBrowserTab>("specs");
  const browserTab = browserTabProp ?? browserTabInternal;
  const setBrowserTab = onBrowserTabChange ?? setBrowserTabInternal;

  if (selectedQuestion) {
    return (
      <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-border/80 bg-[hsl(var(--workspace-panel))] shadow-sm">
        <ScreenerEditorQuestionPropertiesPanel
          screenerId={screener.id}
          markets={screener.markets}
          question={selectedQuestion}
          onClose={onDeselectQuestion}
          onQuestionUpdated={onQuestionUpdated}
          onBackToAiChat={
            browserTab === "ai" ? onDeselectQuestion : undefined
          }
        />
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden border-l border-border/80 bg-[hsl(var(--workspace-panel))] shadow-sm">
      <div
        role="tablist"
        aria-label="Editor tools"
        className="flex shrink-0 border-b border-border/80"
      >
        {BROWSER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={browserTab === tab.id}
            onClick={() => setBrowserTab(tab.id)}
            title={tab.label}
            className={cn(
              "min-w-0 flex-1 border-b-2 px-1 py-3 text-[10px] font-semibold leading-tight transition",
              browserTab === tab.id
                ? "border-blue-600 text-blue-700 dark:border-primary dark:text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="line-clamp-2">{tab.label}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="flex min-h-0 flex-1 flex-col">
        {browserTab === "specs" ? (
          <ScreenerEditorProjectSpecsPanel
            projectId={screener.projectId}
            screenerId={screener.id}
            specs={projectSpecs}
            onSpecsChange={onProjectSpecsChange}
            onSpecsSaved={onProjectSpecsChange}
          />
        ) : browserTab === "library" ? (
          <ScreenerEditorLibraryPanel
            screenerId={screener.id}
            libraryQuestions={libraryQuestions}
            screenerQuestions={screenerQuestions}
            onQuestionAdded={onQuestionAdded}
          />
        ) : (
          <ScreenerEditorAiChatPanel
            screener={screener}
            screenerQuestions={screenerQuestions}
            chatState={aiChatState}
            onChatStateChange={onAiChatStateChange}
            onQuestionAdded={onQuestionAdded}
          />
        )}
      </div>
    </aside>
  );
}
