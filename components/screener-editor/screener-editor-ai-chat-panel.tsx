"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { addAiDraftScreenerQuestion } from "@/app/actions/screener-questions";
import { AiChatSuggestionCard } from "@/components/screener-editor/ai-chat-suggestion-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SCREENER_AI_STARTER_SUGGESTIONS,
  screenerAiChatSystemPrompt,
} from "@/lib/screeners/ai-chat/constants";
import { buildProjectBrief } from "@/lib/screeners/ai-chat/project-brief";
import {
  parseSuggestedQuestions,
  stripSuggestionsBlock,
} from "@/lib/screeners/ai-chat/parse-suggestions";
import { summarizeScreenerQuestions } from "@/lib/screeners/ai-chat/questions-summary";
import { streamChatResponseText } from "@/lib/screeners/ai-chat/stream-response";
import {
  dismissAiChatSuggestion,
  type ScreenerEditorAiChatState,
  type ScreenerQuestionAddedOptions,
} from "@/lib/screeners/ai-chat/editor-chat-state";
import type { AiChatMessage, AiSuggestedQuestion } from "@/lib/screeners/ai-chat/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import { questionTypeHasOptions } from "@/lib/screeners/manual-question";
import { cn } from "@/lib/utils";

function newMessageId(): string {
  return crypto.randomUUID();
}

function withSuggestionIds(
  suggestions: Omit<AiSuggestedQuestion, "id">[],
): AiSuggestedQuestion[] {
  return suggestions.map((s) => ({
    ...s,
    id: newMessageId(),
  }));
}

function toApiMessages(
  messages: AiChatMessage[],
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export function ScreenerEditorAiChatPanel({
  screener,
  screenerQuestions,
  chatState,
  onChatStateChange,
  onQuestionAdded,
}: {
  screener: ScreenerWithProject;
  screenerQuestions: ScreenerQuestion[];
  chatState: ScreenerEditorAiChatState;
  onChatStateChange: Dispatch<SetStateAction<ScreenerEditorAiChatState>>;
  onQuestionAdded: (
    question: ScreenerQuestion,
    options?: ScreenerQuestionAddedOptions,
  ) => void;
}) {
  const { messages, dismissedSuggestionIds } = chatState;
  const dismissedSet = useMemo(
    () => new Set(dismissedSuggestionIds),
    [dismissedSuggestionIds],
  );

  const setMessages = useCallback(
    (updater: AiChatMessage[] | ((prev: AiChatMessage[]) => AiChatMessage[])) => {
      onChatStateChange((current) => ({
        ...current,
        messages:
          typeof updater === "function"
            ? updater(current.messages)
            : updater,
      }));
    },
    [onChatStateChange],
  );

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(
    null,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const projectBrief = useMemo(() => buildProjectBrief(screener), [screener]);
  const currentQuestionsSummary = useMemo(
    () => summarizeScreenerQuestions(screenerQuestions),
    [screenerQuestions],
  );

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMessage: AiChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
      };

      const historyForApi = [...messages, userMessage];
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setStreaming(true);
      setStreamingText("");

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: toApiMessages(historyForApi),
            systemPrompt: screenerAiChatSystemPrompt(),
            projectBrief,
            currentQuestions: currentQuestionsSummary,
          }),
        });

        if (!res.ok) {
          let errorMessage = "Could not reach the AI assistant.";
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) errorMessage = data.error;
          } catch {
            // ignore
          }
          throw new Error(errorMessage);
        }

        if (!res.body) {
          throw new Error("No response stream from the AI assistant.");
        }

        let fullText = "";
        for await (const chunk of streamChatResponseText(res.body)) {
          fullText += chunk;
          setStreamingText(stripSuggestionsBlock(fullText));
        }

        const parsed = parseSuggestedQuestions(fullText);
        const assistantMessage: AiChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: fullText,
          suggestions:
            parsed.length > 0 ? withSuggestionIds(parsed) : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
        toast.error(message);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setStreaming(false);
        setStreamingText("");
        abortRef.current = null;
      }
    },
    [streaming, messages, projectBrief, currentQuestionsSummary, setMessages],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    onChatStateChange((current) =>
      dismissAiChatSuggestion(current, suggestionId),
    );
  };

  const handleAddSuggestion = async (suggestion: AiSuggestedQuestion) => {
    if (addingSuggestionId) return;

    if (
      questionTypeHasOptions(suggestion.questionType) &&
      suggestion.answerOptions.length < 2
    ) {
      toast.error("This suggestion needs at least two answer options.");
      return;
    }

    setAddingSuggestionId(suggestion.id);
    const res = await addAiDraftScreenerQuestion({
      screenerId: screener.id,
      questionText: suggestion.questionText,
      questionType: suggestion.questionType,
      answerOptions: suggestion.answerOptions.map((o) => ({
        text: o.text,
        terminate: Boolean(o.terminate),
        logicNote: o.logicNote ?? "",
      })),
    });
    setAddingSuggestionId(null);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Question added as AI draft.");
    onQuestionAdded(res.question, { select: false });
    handleDismissSuggestion(suggestion.id);
  };

  const visibleSuggestions = (message: AiChatMessage) =>
    (message.suggestions ?? []).filter((s) => !dismissedSet.has(s.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        aria-live="polite"
      >
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
              <Bot className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Ask for new questions, improvements, or a review of standard
              sections. Suggestions can be added to your screener as AI drafts.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const displayContent = isUser
                ? message.content
                : stripSuggestionsBlock(message.content);
              const suggestions = visibleSuggestions(message);

              return (
                <li
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-2",
                    isUser ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[95%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                      isUser
                        ? "bg-blue-600 text-white dark:bg-primary"
                        : "border border-border/80 bg-[hsl(var(--workspace-surface))] text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{displayContent}</p>
                  </div>

                  {suggestions.length > 0 ? (
                    <div className="w-full space-y-2">
                      {suggestions.map((suggestion) => (
                        <AiChatSuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          adding={addingSuggestionId === suggestion.id}
                          onAdd={() => void handleAddSuggestion(suggestion)}
                          onDismiss={() =>
                            handleDismissSuggestion(suggestion.id)
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}

            {streaming ? (
              <li className="flex flex-col items-start gap-2">
                <div className="max-w-[95%] rounded-lg border border-border/80 bg-[hsl(var(--workspace-surface))] px-3 py-2 text-xs leading-relaxed text-foreground">
                  {streamingText ? (
                    <p className="whitespace-pre-wrap">{streamingText}</p>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Thinking…
                    </span>
                  )}
                </div>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border/80 bg-[hsl(var(--workspace-panel))] p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SCREENER_AI_STARTER_SUGGESTIONS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={streaming}
              onClick={() => void sendMessage(chip)}
              className="rounded-full border border-border/80 bg-[hsl(var(--workspace-surface))] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-blue-300 hover:text-foreground disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="Ask about questions, wording, or sections…"
            disabled={streaming}
            rows={3}
            className="min-h-[72px] resize-none text-xs"
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 w-full gap-1.5 text-xs"
            disabled={streaming || !input.trim()}
          >
            {streaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
