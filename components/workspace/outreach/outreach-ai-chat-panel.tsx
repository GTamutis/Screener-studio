"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  OUTREACH_AI_STARTER_SUGGESTIONS,
  OUTREACH_AI_WELCOME_MESSAGE,
  outreachAiChatSystemPrompt,
} from "@/lib/workspace/outreach-ai/constants";
import {
  buildArticleBrief,
  buildClientContextBrief,
} from "@/lib/workspace/outreach-ai/build-article-brief";
import type { OutreachAiChatMessage } from "@/lib/workspace/outreach-ai/types";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";
import { streamChatResponseText } from "@/lib/screeners/ai-chat/stream-response";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

function newMessageId(): string {
  return crypto.randomUUID();
}

function toApiMessages(
  messages: OutreachAiChatMessage[],
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

type OutreachAiChatPanelProps = {
  article: IndustryNewsItem;
  projectClientNames?: string[];
  messages: OutreachAiChatMessage[];
  onMessagesChange: (messages: OutreachAiChatMessage[]) => void;
  onBeforeSend: () => Promise<string | null>;
  onConversationComplete?: (
    sessionId: string,
    messages: OutreachAiChatMessage[],
  ) => void | Promise<void>;
  className?: string;
};

export function OutreachAiChatPanel({
  article,
  projectClientNames = [],
  messages,
  onMessagesChange,
  onBeforeSend,
  onConversationComplete,
  className,
}: OutreachAiChatPanelProps) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const projectBrief = useMemo(() => {
    const parts = [
      buildArticleBrief(article),
      buildClientContextBrief(projectClientNames),
    ].filter(Boolean);
    return parts.join("\n\n");
  }, [article, projectClientNames]);

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

      const resolvedSessionId = await onBeforeSend();
      if (!resolvedSessionId) return;

      const userMessage: OutreachAiChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
      };

      const historyForApi = [...messagesRef.current, userMessage];
      onMessagesChange([...messagesRef.current, userMessage]);
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
            systemPrompt: outreachAiChatSystemPrompt(),
            projectBrief,
            currentQuestions: [],
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
          setStreamingText(fullText);
        }

        const assistantMessage: OutreachAiChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: fullText,
        };

        const nextMessages = [...historyForApi, assistantMessage];
        onMessagesChange(nextMessages);
        await onConversationComplete?.(resolvedSessionId, nextMessages);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
        toast.error(message);
        onMessagesChange(messagesRef.current.slice(0, -1));
      } finally {
        setStreaming(false);
        setStreamingText("");
        abortRef.current = null;
      }
    },
    [
      streaming,
      onBeforeSend,
      onMessagesChange,
      onConversationComplete,
      projectBrief,
    ],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const showWelcome = messages.length === 0 && !streaming;

  return (
    <div
      className={cn(
        workspaceCardClassName,
        "flex min-h-[420px] flex-col overflow-hidden sm:min-h-[480px]",
        className,
      )}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {showWelcome ? (
          <ul className="space-y-3">
            <li className="flex flex-col items-start gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                <Bot className="h-4 w-4" aria-hidden />
              </div>
              <div className="max-w-[95%] rounded-lg border border-border/80 bg-[hsl(var(--workspace-surface))] px-3 py-2 text-xs leading-relaxed text-foreground">
                <p className="whitespace-pre-wrap">{OUTREACH_AI_WELCOME_MESSAGE}</p>
              </div>
            </li>
          </ul>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => {
              const isUser = message.role === "user";
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
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
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
          {OUTREACH_AI_STARTER_SUGGESTIONS.map((chip) => (
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
            placeholder="Client, goal, channel, tone…"
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
