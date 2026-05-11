"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import {
  createInviteSession,
  deleteInviteSession,
} from "@/app/actions/invitely";
import type { InvitelySessionSummary } from "@/lib/invitely/types";

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
    <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-900">
          {session.projectName}
        </h3>
        <p className="text-sm text-slate-600">
          Client:{" "}
          <span className="font-medium text-slate-800">{session.clientName}</span>
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(session.countries ?? []).map((c) => (
          <span
            key={c}
            className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-900 ring-1 ring-inset ring-indigo-100"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-900"
        >
          Copy link
        </button>
        <Link
          href={`/project-management/invitely/sessions/${session.id}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          View
        </Link>
        <button
          type="button"
          disabled={pendingDelete}
          onClick={handleDelete}
          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm">
        <p className="font-semibold">Invitely needs configuration</p>
        <p className="mt-2 text-amber-900/90">{setupError}</p>
        <p className="mt-3 text-xs text-amber-900/80">
          Add Supabase environment variables and run{" "}
          <span className="font-mono">supabase/migrations/001_invitely.sql</span>{" "}
          against your database.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
      <section className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-900">New session</h2>
        <p className="mt-2 text-xs text-slate-600">
          Password is stored hashed — share it with your client outside Invitely.
        </p>
        <form
          id="invitely-create-form"
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate(new FormData(e.currentTarget));
          }}
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Client name
            </label>
            <input
              required
              name="clientName"
              placeholder="Acme Corp"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Project / study name
            </label>
            <input
              required
              name="projectName"
              placeholder="EU diary study — Wave 2"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Countries (comma-separated)
            </label>
            <input
              required
              name="countriesRaw"
              placeholder="UK, US, Germany, Japan"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Client password
            </label>
            <input
              required
              type="password"
              name="password"
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
            />
          </div>
          <button
            type="submit"
            disabled={pendingCreate}
            className="w-full rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingCreate ? "Creating…" : "Create session"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Your sessions</h2>
          <p className="mt-1 text-xs text-slate-600">
            Newest first. Share the invite link plus password with your client.
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-5 py-12 text-center text-sm text-slate-600">
            No sessions yet — create one with the form on the left (or above on small
            screens).
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {sorted.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
