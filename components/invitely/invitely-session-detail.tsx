"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { PmSessionDetail } from "@/app/actions/invitely";
import type { InvitelyAttendee } from "@/lib/invitely/types";
import { CirclePlus, PencilLine, Trash2 } from "lucide-react";

function slugFilename(projectName: string) {
  const base = projectName.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 80);
  return `${base || "invite-list"}.csv`;
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function attendeesForCountry(
  countries: readonly string[],
  attendees: readonly InvitelyAttendee[],
  country: string,
) {
  return attendees.filter(
    (a) =>
      a.inviteAll ||
      (!a.inviteAll && (a.selectedCountries ?? []).includes(country)),
  );
}

function buildCsv(countries: readonly string[], attendees: readonly InvitelyAttendee[]) {
  const lines = ["Country,Name,Email"];
  for (const attendee of attendees) {
    const targets = attendee.inviteAll ? [...countries] : [...attendee.selectedCountries];
    for (const country of targets) {
      lines.push(
        [csvEscape(country), csvEscape(attendee.name), csvEscape(attendee.email)].join(
          ",",
        ),
      );
    }
  }
  return `${lines.join("\r\n")}\r\n`;
}

function formatLogState(entry: PmSessionDetail["changelog"][number]) {
  const snapshot =
    entry.inviteAll === true
      ? "Invite to all"
      : (entry.selectedCountries ?? []).join(", ") || "No country selections";
  if (entry.action === "delete") {
    return `Prior state: ${snapshot}`;
  }
  return `Resulting state: ${snapshot}`;
}

export function InvitelySessionDetail({ detail }: { detail: PmSessionDetail }) {
  const { session, attendees, changelog } = detail;

  const handleExportCsv = () => {
    const csv = buildCsv(session.countries, attendees);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = slugFilename(session.projectName);
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const copyEmails = async (country: string, emails: string[]) => {
    const payload = emails.join(", ");
    try {
      await navigator.clipboard.writeText(payload);
      toast.success(`Copied emails for ${country}`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Session
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">{session.projectName}</h1>
          <p className="text-sm text-slate-600">
            Client:{" "}
            <span className="font-medium text-slate-900">{session.clientName}</span>
          </p>
          <p className="text-sm text-slate-600">
            Total attendees:{" "}
            <span className="font-semibold text-slate-900">{attendees.length}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
          >
            Export CSV
          </button>
          <Link
            href="/project-management/invitely"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Invite breakdown</h2>
          <p className="mt-1 text-xs text-slate-600">
            Includes anyone marked invite-all plus per-country selections.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {session.countries.map((country) => {
            const rows = attendeesForCountry(session.countries, attendees, country);
            const emails = rows.map((r) => r.email.trim()).filter(Boolean);
            return (
              <div
                key={country}
                className="rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{country}</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {rows.length} attendee{rows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyEmails(country, emails)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Copy emails
                  </button>
                </div>
                <ul className="mt-4 divide-y divide-slate-100 text-sm">
                  {rows.length === 0 ? (
                    <li className="py-3 text-slate-500">No one assigned yet.</li>
                  ) : (
                    rows.map((r) => (
                      <li key={r.id} className="flex flex-col gap-0.5 py-3">
                        <span className="font-medium text-slate-900">{r.name}</span>
                        <span className="text-xs text-slate-600">{r.email}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Change log</h2>
          <p className="mt-1 text-xs text-slate-600">
            Newest first — up to 200 entries. No emails are sent automatically.
          </p>
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
          {changelog.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">
              No changes recorded yet.
            </p>
          ) : (
            changelog.map((entry) => {
              const Icon =
                entry.action === "add"
                  ? CirclePlus
                  : entry.action === "update"
                    ? PencilLine
                    : Trash2;
              const tone =
                entry.action === "add"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                  : entry.action === "update"
                    ? "text-sky-800 bg-sky-50 border-sky-100"
                    : "text-rose-700 bg-rose-50 border-rose-100";

              const verb =
                entry.action === "add"
                  ? "Added attendee"
                  : entry.action === "update"
                    ? "Updated attendee"
                    : "Removed attendee";

              return (
                <div key={entry.id} className="flex gap-3 px-4 py-4">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-slate-900">{verb}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{entry.actorName}</span> ·{" "}
                      <span className="font-semibold text-slate-900">
                        {entry.attendeeLabel}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600">{formatLogState(entry)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
