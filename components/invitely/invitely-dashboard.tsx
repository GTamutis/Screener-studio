"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Copy,
  Eye,
  Globe,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  createInviteSession,
  deleteInviteSession,
} from "@/app/actions/invitely";
import type { InvitelySessionSummary } from "@/lib/invitely/types";

import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { EmptyState } from "@/components/ui/glass/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function inviteUrl(sessionId: string) {
  if (typeof window === "undefined") return `/invite/${sessionId}`;
  return `${window.location.origin}/invite/${sessionId}`;
}

function SessionCard({ session }: { session: InvitelySessionSummary }) {
  const router = useRouter();
  const [pendingDelete, startDelete] = useTransition();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(session.id));
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDelete = () => {
    const ok = window.confirm(
      "Delete this session and all attendees? This cannot be undone.",
    );
    if (!ok) return;
    startDelete(async () => {
      const res = await deleteInviteSession(session.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Deleted");
      router.refresh();
    });
  };

  return (
    <GlassCard interactive className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {session.projectName}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Client:{" "}
            <span className="font-medium text-foreground">
              {session.clientName}
            </span>
          </p>
        </div>
        <Badge variant="gradient" className="shrink-0">
          <Globe className="mr-1 h-3 w-3" />
          {session.countries.length}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(session.countries ?? []).map((c) => (
          <span
            key={c}
            className="rounded-full bg-brand-gradient-soft px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-inset ring-primary/15"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void handleCopy()}>
          <Copy className="h-3.5 w-3.5" />
          Copy link
        </Button>
        <Button asChild size="sm" variant="glass">
          <Link
            href={`/project-management/invitely/sessions/${session.id}`}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pendingDelete}
          onClick={handleDelete}
          className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete session"
        >
          {pendingDelete ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </GlassCard>
  );
}

export function InvitelyDashboard({
  initialSessions,
  setupError,
}: {
  initialSessions: InvitelySessionSummary[];
  setupError: string | null;
}) {
  const router = useRouter();
  const [pendingCreate, startCreate] = useTransition();
  const sessions = initialSessions;

  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [sessions],
  );

  const handleCreate = (formData: FormData) => {
    startCreate(async () => {
      const clientName = String(formData.get("clientName") ?? "");
      const projectName = String(formData.get("projectName") ?? "");
      const countriesRaw = String(formData.get("countriesRaw") ?? "");
      const password = String(formData.get("password") ?? "");

      const res = await createInviteSession({
        clientName,
        projectName,
        countriesRaw,
        password,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Session created — share the password with your client.");
      router.refresh();
      const form = document.getElementById(
        "invitely-create-form",
      ) as HTMLFormElement | null;
      form?.reset();
    });
  };

  if (setupError) {
    return (
      <div className="space-y-10">
        <PageHeader
          eyebrow="Project management · Invitely"
          title="Invitely"
          description="Password-protected attendee lists for multi-country studies."
        />
        <GlassCard className="flex items-start gap-4 border-amber-300/40 bg-amber-50/60 p-6 text-amber-950 ring-1 ring-inset ring-amber-200/40 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Invitely needs configuration</p>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/80">
              {setupError}
            </p>
            <p className="text-xs text-amber-900/70 dark:text-amber-100/60">
              Add Supabase environment variables and run{" "}
              <code className="rounded-md bg-amber-100/60 px-1.5 py-0.5 font-mono text-[11px] dark:bg-amber-400/10">
                supabase/migrations/001_invitely.sql
              </code>{" "}
              against your database.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Project management · Invitely"
        title="Invitely"
        description="Share password-protected attendee lists with clients. They edit; you export."
        actions={
          <Badge variant="success">
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <GlassCard className="overflow-hidden p-0">
            <div className="relative border-b border-border/40 bg-brand-gradient-soft px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    New session
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Password is stored hashed.
                  </p>
                </div>
              </div>
            </div>
            <form
              id="invitely-create-form"
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="clientName">Client name</Label>
                <Input
                  required
                  id="clientName"
                  name="clientName"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="projectName">Project / study name</Label>
                <Input
                  required
                  id="projectName"
                  name="projectName"
                  placeholder="EU diary study — Wave 2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="countriesRaw">Countries (comma-separated)</Label>
                <Input
                  required
                  id="countriesRaw"
                  name="countriesRaw"
                  placeholder="UK, US, Germany, Japan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Client password</Label>
                <Input
                  required
                  id="password"
                  name="password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••"
                />
                <p className="text-[11px] text-muted-foreground">
                  Share this with your client outside Invitely.
                </p>
              </div>
              <Button
                type="submit"
                disabled={pendingCreate}
                className="w-full"
                size="lg"
              >
                {pendingCreate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create session
                  </>
                )}
              </Button>
            </form>
          </GlassCard>
        </aside>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Your sessions
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Newest first. Share the invite link plus password with your
                client.
              </p>
            </div>
          </div>

          {sorted.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No sessions yet"
              description="Create one with the form on the left (or above on small screens). Each session gets its own password-protected page."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {sorted.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
