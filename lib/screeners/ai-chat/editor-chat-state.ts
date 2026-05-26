import type { AiChatMessage } from "@/lib/screeners/ai-chat/types";

export type ScreenerQuestionAddedOptions = {
  /** When false, keep the right panel on the current tab (e.g. AI Chat). Default true. */
  select?: boolean;
};

export type ScreenerEditorAiChatState = {
  messages: AiChatMessage[];
  dismissedSuggestionIds: string[];
};

export function createEmptyAiChatState(): ScreenerEditorAiChatState {
  return { messages: [], dismissedSuggestionIds: [] };
}

export function dismissAiChatSuggestion(
  state: ScreenerEditorAiChatState,
  suggestionId: string,
): ScreenerEditorAiChatState {
  if (state.dismissedSuggestionIds.includes(suggestionId)) {
    return state;
  }
  return {
    ...state,
    dismissedSuggestionIds: [
      ...state.dismissedSuggestionIds,
      suggestionId,
    ],
  };
}
