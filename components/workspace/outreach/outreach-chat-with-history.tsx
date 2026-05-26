"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { History, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createOutreachChatSession,
  deleteOutreachChatSession,
  getOutreachChatSession,
  listOutreachChatSessions,
  saveOutreachChatSession,
} from "@/app/actions/outreach-chats";
import { OutreachAiChatPanel } from "@/components/workspace/outreach/outreach-ai-chat-panel";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";
import type { OutreachChatSessionSummary } from "@/lib/workspace/outreach-ai/session-types";
import type { OutreachAiChatMessage } from "@/lib/workspace/outreach-ai/types";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

type OutreachChatWithHistoryProps = {
  article: IndustryNewsItem;
  projectClientNames?: string[];
  initialSessions: OutreachChatSessionSummary[];
  className?: string;
};

export function OutreachChatWithHistory({
  article,
  projectClientNames = [],
  initialSessions,
  className,
}: OutreachChatWithHistoryProps) {
  const [sessions, setSessions] =
    useState<OutreachChatSessionSummary[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<OutreachAiChatMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(
    Boolean(initialSessions[0]?.id),
  );
  const [isDraft, setIsDraft] = useState(!initialSessions[0]?.id);

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMessagesRef = useRef(messages);
  const activeSessionIdRef = useRef<string | null>(initialSessions[0]?.id ?? null);
  const initialSessionIdRef = useRef(initialSessions[0]?.id);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const refreshSessions = useCallback(async () => {
    const result = await listOutreachChatSessions(article.id);
    if (!("error" in result)) {
      setSessions(result);
    }
  }, [article.id]);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoadingSession(true);
    const result = await getOutreachChatSession(sessionId);
    setLoadingSession(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setActiveSessionId(result.id);
    activeSessionIdRef.current = result.id;
    setMessages(result.messages);
    setIsDraft(false);
  }, []);

  useEffect(() => {
    const id = initialSessionIdRef.current;
    if (id) {
      void loadSession(id);
    }
  }, [loadSession]);

  const persistMessages = useCallback(
    async (sessionId: string, nextMessages: OutreachAiChatMessage[]) => {
      const result = await saveOutreachChatSession(sessionId, nextMessages);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      await refreshSessions();
    },
    [refreshSessions],
  );

  const schedulePersist = useCallback(
    (sessionId: string, nextMessages: OutreachAiChatMessage[]) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = setTimeout(() => {
        void persistMessages(sessionId, nextMessages);
      }, 400);
    },
    [persistMessages],
  );

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (activeSessionIdRef.current) return activeSessionIdRef.current;

    const result = await createOutreachChatSession(article);
    if ("error" in result) {
      toast.error(result.error);
      return null;
    }

    activeSessionIdRef.current = result.sessionId;
    setActiveSessionId(result.sessionId);
    setIsDraft(false);
    await refreshSessions();
    return result.sessionId;
  }, [article, refreshSessions]);

  const handleMessagesChange = useCallback(
    (nextMessages: OutreachAiChatMessage[]) => {
      setMessages(nextMessages);
      const sid = activeSessionIdRef.current;
      if (sid && nextMessages.length > 0) {
        schedulePersist(sid, nextMessages);
      }
    },
    [schedulePersist],
  );

  const handleBeforeSend = useCallback(async () => {
    return ensureSession();
  }, [ensureSession]);

  const handleConversationComplete = useCallback(
    async (sessionId: string, nextMessages: OutreachAiChatMessage[]) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
      await persistMessages(sessionId, nextMessages);
    },
    [persistMessages],
  );

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) return;
      void loadSession(sessionId);
    },
    [activeSessionId, loadSession],
  );

  const handleStartNewChat = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    activeSessionIdRef.current = null;
    setActiveSessionId(null);
    setMessages([]);
    setIsDraft(true);
    setLoadingSession(false);
  }, []);

  const handleDeleteSession = useCallback(async () => {
    if (!activeSessionId) return;

    const confirmed = window.confirm(
      "Delete this chat from your history? This cannot be undone.",
    );
    if (!confirmed) return;

    const deletingId = activeSessionId;
    const result = await deleteOutreachChatSession(deletingId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success("Chat deleted.");
    const remaining = sessions.filter((s) => s.id !== deletingId);
    setSessions(remaining);

    if (remaining[0]) {
      void loadSession(remaining[0].id);
      return;
    }

    handleStartNewChat();
  }, [activeSessionId, sessions, loadSession, handleStartNewChat]);

  const sessionOptions = useMemo(
    () =>
      sessions.map((session) => ({
        value: session.id,
        label: `${session.preview} · ${formatRelativeTime(session.updatedAt)}`,
      })),
    [sessions],
  );

  const historyLabel =
    sessions.length === 0
      ? "No saved chats yet"
      : `${sessions.length} saved chat${sessions.length === 1 ? "" : "s"}`;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          workspaceCardClassName,
          "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <History
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Historic chats</p>
            <p className="text-[11px] text-muted-foreground">{historyLabel}</p>
          </div>
          {sessions.length > 0 ? (
            <FilterSelect
              size="sm"
              value={activeSessionId ?? ""}
              onValueChange={handleSelectSession}
              aria-label="Select a previous chat"
              disabled={loadingSession}
              options={sessionOptions}
              className="min-w-[12rem] max-w-full flex-1"
            />
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {activeSessionId && !isDraft ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => void handleDeleteSession()}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={handleStartNewChat}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New chat
          </Button>
        </div>
      </div>

      {loadingSession ? (
        <div
          className={cn(
            workspaceCardClassName,
            "flex min-h-[420px] items-center justify-center sm:min-h-[480px]",
          )}
        >
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading chat…
          </span>
        </div>
      ) : (
        <OutreachAiChatPanel
          article={article}
          projectClientNames={projectClientNames}
          messages={messages}
          onMessagesChange={handleMessagesChange}
          onBeforeSend={handleBeforeSend}
          onConversationComplete={handleConversationComplete}
        />
      )}
    </div>
  );
}
