"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { archiveLibraryQuestion } from "@/app/actions/question-library-admin";
import { QuestionFormDialog } from "@/components/question-library/admin/question-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/glass/empty-state";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { PageHeader } from "@/components/ui/glass/page-header";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  QUESTION_TYPE_LABELS,
} from "@/lib/question-library/constants";
import { dbCategoryToForm } from "@/lib/question-library/admin-constants";
import { ADMIN_FORM_CATEGORIES } from "@/lib/question-library/admin-constants";
import type { AdminQuestionLibraryItem } from "@/lib/question-library/types";
import { cn } from "@/lib/utils";

function statusBadge(status: AdminQuestionLibraryItem["status"]) {
  if (status === "approved") return <Badge variant="gradient">Approved</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

function truncate(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

type StatusFilter = "all" | "draft" | "approved" | "archived";

export function QuestionLibraryAdmin({
  questions,
}: {
  questions: AdminQuestionLibraryItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuestionLibraryItem | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questions.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        item.displayId,
        item.questionText,
        item.category,
        item.status,
        item.approvedBy,
        ...(item.tags ?? []),
        ...(item.sector ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [questions, query, statusFilter]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: AdminQuestionLibraryItem) {
    setEditing(item);
    setFormOpen(true);
  }

  function handleArchive(item: AdminQuestionLibraryItem) {
    const label = item.displayId ?? truncate(item.questionText, 48);
    if (
      !window.confirm(
        `Archive "${label}"? It will no longer appear in the public question library.`,
      )
    ) {
      return;
    }

    setArchivingId(item.id);
    startTransition(async () => {
      const result = await archiveLibraryQuestion(item.id);
      setArchivingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Question archived.");
      router.refresh();
    });
  }

  const categoryLabel = (item: AdminQuestionLibraryItem) => {
    const formCat = dbCategoryToForm(item.category);
    const def = ADMIN_FORM_CATEGORIES.find((c) => c.value === formCat);
    return def?.label ?? CATEGORY_LABELS[item.category] ?? item.category;
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Screener Studio · Admin"
        title="Question library"
        description="Manage draft, approved, and archived questions. Changes sync to the public library when status is approved."
        actions={
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add question
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="pl-9"
            aria-label="Search questions"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["draft", "Draft"],
              ["approved", "Approved"],
              ["archived", "Archived"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={statusFilter === id ? "default" : "glass"}
              className={cn(
                "rounded-full",
                statusFilter === id && "shadow-glow-primary",
              )}
              onClick={() => setStatusFilter(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          of {questions.length} questions
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No questions found"
          description="Adjust filters or add a new question."
          action={
            <Button type="button" onClick={openCreate}>
              Add question
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <GlassCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.displayId ? (
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                        {item.displayId}
                      </span>
                    ) : null}
                    {statusBadge(item.status)}
                    <Badge variant="secondary" className="text-[10px]">
                      {QUESTION_TYPE_LABELS[item.questionType] ??
                        item.questionType}
                    </Badge>
                    <Badge variant="info" className="text-[10px]">
                      {categoryLabel(item)}
                    </Badge>
                    {item.isLocked ? (
                      <Lock
                        className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                        aria-label="Locked"
                      />
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {truncate(item.questionText)}
                  </p>
                  {item.sector?.length ? (
                    <p className="text-[11px] text-muted-foreground">
                      Sector: {item.sector.join(", ")}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Sector: All
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    className="gap-1"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {item.status !== "archived" ? (
                    <Button
                      type="button"
                      variant="glass"
                      size="sm"
                      className="gap-1"
                      disabled={pending && archivingId === item.id}
                      onClick={() => handleArchive(item)}
                    >
                      {pending && archivingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                      Archive
                    </Button>
                  ) : null}
                </div>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        question={editing}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
