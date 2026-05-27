"use client";

import { useMemo, useState } from "react";
import { Bug, Inbox, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { PageHeader } from "@/components/ui/glass/page-header";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  FEEDBACK_KIND_LABELS,
  type WorkspaceFeedbackEntry,
  type WorkspaceFeedbackKind,
} from "@/lib/workspace/feedback/types";
import { cn } from "@/lib/utils";

type Filter = "all" | WorkspaceFeedbackKind;

function KindBadge({ kind }: { kind: WorkspaceFeedbackKind }) {
  if (kind === "bug") {
    return (
      <Badge variant="outline" className="gap-1 border-amber-300/50 text-amber-800 dark:text-amber-200">
        <Bug className="h-3 w-3" />
        Bug
      </Badge>
    );
  }

  return (
    <Badge variant="info" className="gap-1">
      <Lightbulb className="h-3 w-3" />
      Suggestion
    </Badge>
  );
}

export function WorkspaceFeedbackInbox({
  entries,
}: {
  entries: WorkspaceFeedbackEntry[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.kind === filter);
  }, [entries, filter]);

  const counts = useMemo(
    () => ({
      all: entries.length,
      bug: entries.filter((entry) => entry.kind === "bug").length,
      suggestion: entries.filter((entry) => entry.kind === "suggestion").length,
    }),
    [entries],
  );

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "bug", label: "Bugs", count: counts.bug },
    { key: "suggestion", label: "Suggestions", count: counts.suggestion },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Feedback inbox"
        description="Bug reports and improvement suggestions from workspace users."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === item.key
                ? "border-primary/30 bg-brand-gradient-soft text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No feedback yet{filter === "all" ? "." : ` in ${filter === "bug" ? "bugs" : "suggestions"}.`}
          </p>
        </GlassCard>
      ) : (
        <ul className="space-y-4">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <GlassCard className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <KindBadge kind={entry.kind} />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {entry.userDisplayName || entry.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.userEmail}
                      {entry.pageUrl ? (
                        <>
                          <span className="mx-1.5 text-border">·</span>
                          <span className="font-mono">{entry.pageUrl}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {entry.id.slice(0, 8)}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {entry.message}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {FEEDBACK_KIND_LABELS[entry.kind]} ·{" "}
                  {new Date(entry.createdAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
