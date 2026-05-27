"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CirclePlus,
  Copy,
  Download,
  Globe,
  PencilLine,
  Trash2,
  Users,
} from "lucide-react";

import type { PmSessionDetail } from "@/app/actions/invitely";
import type { InvitelyAttendee } from "@/lib/invitely/types";

import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function slugFilename(projectName: string) {
  const base = projectName
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
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

function buildCsv(
  countries: readonly string[],
  attendees: readonly InvitelyAttendee[],
) {
  const lines = ["Country,Name,Email"];
  for (const attendee of attendees) {
    const targets = attendee.inviteAll
      ? [...countries]
      : [...attendee.selectedCountries];
    for (const country of targets) {
      lines.push(
        [
          csvEscape(country),
          csvEscape(attendee.name),
          csvEscape(attendee.email),
        ].join(","),
      );
    }
  }
  return `${lines.join("\r\n")}\r\n`;
}

function formatLogState(entry: PmSessionDetail["changelog"][number]) {
  const snapshot =
    entry.inviteAll === true
      ? "Invite to all"
      : (entry.selectedCountries ?? []).join(", ") ||
        "No country selections";
  if (entry.action === "delete") {
    return `Prior state: ${snapshot}`;
  }
  return `Resulting state: ${snapshot}`;
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl glass-surface px-3.5 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-glow-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function InvitelySessionDetail({
  detail,
}: {
  detail: PmSessionDetail;
}) {
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
    const payload = emails.join("; ");
    try {
      await navigator.clipboard.writeText(payload);
      toast.success(`Copied emails for ${country}`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <Link
          href="/invitely"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Invitely
        </Link>
        <PageHeader
          eyebrow={`Session · ${session.clientName}`}
          title={session.projectName}
          description={`Multi-country invite list with ${attendees.length} attendee${attendees.length === 1 ? "" : "s"} across ${session.countries.length} countr${session.countries.length === 1 ? "y" : "ies"}.`}
          actions={
            <>
              <Button onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </>
          }
        />
        <div className="flex flex-wrap gap-3">
          <Stat icon={Users} label="Attendees" value={attendees.length} />
          <Stat icon={Globe} label="Countries" value={session.countries.length} />
          <Stat
            icon={PencilLine}
            label="Changes logged"
            value={changelog.length}
          />
        </div>
      </div>

      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Invite breakdown
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Includes anyone marked invite-all plus per-country selections.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {session.countries.map((country) => {
            const rows = attendeesForCountry(
              session.countries,
              attendees,
              country,
            );
            const emails = rows.map((r) => r.email.trim()).filter(Boolean);
            return (
              <GlassCard key={country} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {country}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rows.length} attendee{rows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={() => void copyEmails(country, emails)}
                    disabled={emails.length === 0}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy emails
                  </Button>
                </div>
                <ul className="mt-4 divide-y divide-border/40 text-sm">
                  {rows.length === 0 ? (
                    <li className="py-3 text-muted-foreground">
                      No one assigned yet.
                    </li>
                  ) : (
                    rows.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <span className="font-medium text-foreground">
                          {r.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {r.email}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Change log
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Newest first — up to 200 entries. No emails are sent automatically.
          </p>
        </div>
        <GlassCard className="p-0">
          {changelog.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No changes recorded yet.
            </p>
          ) : (
            <ol className="relative px-6 py-4">
              <span
                aria-hidden
                className="absolute left-[34px] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border to-transparent"
              />
              {changelog.map((entry) => {
                const Icon =
                  entry.action === "add"
                    ? CirclePlus
                    : entry.action === "update"
                      ? PencilLine
                      : Trash2;
                const variant =
                  entry.action === "add"
                    ? "success"
                    : entry.action === "update"
                      ? "info"
                      : "destructive";
                const tone =
                  entry.action === "add"
                    ? "from-emerald-400/30 via-emerald-400/20 to-transparent text-emerald-600 dark:text-emerald-300"
                    : entry.action === "update"
                      ? "from-sky-400/30 via-sky-400/20 to-transparent text-sky-600 dark:text-sky-300"
                      : "from-rose-400/30 via-rose-400/20 to-transparent text-rose-600 dark:text-rose-300";
                const verb =
                  entry.action === "add"
                    ? "Added attendee"
                    : entry.action === "update"
                      ? "Updated attendee"
                      : "Removed attendee";

                return (
                  <li
                    key={entry.id}
                    className="relative flex gap-4 py-4 first:pt-2 last:pb-2"
                  >
                    <div
                      className={cn(
                        "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-1 ring-inset ring-white/40 backdrop-blur dark:ring-white/10",
                        tone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge variant={variant} className="capitalize">
                          {verb}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-muted-foreground">
                          {entry.actorName}
                        </span>{" "}
                        ·{" "}
                        <span className="font-semibold">
                          {entry.attendeeLabel}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatLogState(entry)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
