"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardPaste,
  Lock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import {
  clientAddAttendee,
  clientBulkPasteAttendees,
  clientDeleteAttendee,
  clientUpdateAttendee,
  unlockInviteSession,
} from "@/app/actions/invitely";
import type {
  InvitelyAttendee,
  InvitelyInvitePublicMeta,
  InvitelySessionCreator,
} from "@/lib/invitely/types";
import { ACTOR_NAME_MAX } from "@/lib/invitely/validation";

import { DayOneLogo } from "@/components/brand/day-one-logo";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function invitePath(sessionId: string) {
  return `/invite/${sessionId}`;
}

function InviteBrandLogo({ className }: { className?: string }) {
  return (
    <DayOneLogo
      className={cn("h-11 w-auto sm:h-12", className)}
      decorative={false}
    />
  );
}

function LinkCreatorBlock({ createdBy }: { createdBy: InvitelySessionCreator }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 px-3.5 py-2.5 text-right">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Link set up by
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{createdBy.name}</p>
      {createdBy.email ? (
        <p className="truncate text-xs text-muted-foreground">{createdBy.email}</p>
      ) : null}
    </div>
  );
}

export function InviteSessionClient({
  sessionId,
  publicMeta,
}: {
  sessionId: string;
  publicMeta: InvitelyInvitePublicMeta;
}) {
  const [phase, setPhase] = useState<"locked" | "open">("locked");
  const [actorName, setActorName] = useState("");
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [meta, setMeta] = useState<{
    projectName: string;
    clientName: string;
    countries: string[];
    createdBy: InvitelySessionCreator;
  } | null>(null);
  const [attendees, setAttendees] = useState<InvitelyAttendee[]>([]);
  const [bulkText, setBulkText] = useState("");
  const [origin, setOrigin] = useState("");

  const attendeesRef = useRef(attendees);
  attendeesRef.current = attendees;

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const flushSave = useCallback(
    async (attendeeId: string) => {
      const pending = saveTimers.current[attendeeId];
      if (pending) {
        clearTimeout(pending);
        delete saveTimers.current[attendeeId];
      }

      const row = attendeesRef.current.find((a) => a.id === attendeeId);
      if (!row) return;

      const res = await clientUpdateAttendee({
        sessionId,
        password,
        actorName,
        attendeeId: row.id,
        name: row.name,
        email: row.email,
        inviteAll: row.inviteAll,
        selectedCountries: row.selectedCountries,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      setAttendees((prev) =>
        prev.map((a) => (a.id === res.attendee.id ? res.attendee : a)),
      );
      toast.success("Saved");
    },
    [actorName, password, sessionId],
  );

  const scheduleSave = useCallback(
    (attendeeId: string) => {
      const existing = saveTimers.current[attendeeId];
      if (existing) clearTimeout(existing);
      saveTimers.current[attendeeId] = setTimeout(() => {
        void flushSave(attendeeId);
      }, 450);
    },
    [flushSave],
  );

  const persistImmediate = useCallback(
    async (
      nextRow: InvitelyAttendee,
      opts?: { silentToast?: boolean },
    ): Promise<boolean> => {
      const res = await clientUpdateAttendee({
        sessionId,
        password,
        actorName,
        attendeeId: nextRow.id,
        name: nextRow.name,
        email: nextRow.email,
        inviteAll: nextRow.inviteAll,
        selectedCountries: nextRow.selectedCountries,
      });

      if (!res.ok) {
        toast.error(res.error);
        return false;
      }

      setAttendees((prev) =>
        prev.map((a) => (a.id === res.attendee.id ? res.attendee : a)),
      );
      if (!opts?.silentToast) toast.success("Saved");
      return true;
    },
    [actorName, password, sessionId],
  );

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedActor = actorName.trim();
    if (!trimmedActor) {
      toast.error("Enter your name before unlocking.");
      return;
    }
    if (trimmedActor.length > ACTOR_NAME_MAX) {
      toast.error(`Name must be at most ${ACTOR_NAME_MAX} characters.`);
      return;
    }

    setUnlocking(true);
    try {
      const res = await unlockInviteSession({ sessionId, password });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      setMeta({
        projectName: res.session.projectName,
        clientName: res.session.clientName,
        countries: res.session.countries,
        createdBy: res.session.createdBy,
      });
      setAttendees(res.attendees);
      setPhase("open");
      toast.success("Unlocked");
    } finally {
      setUnlocking(false);
    }
  };

  const handleAddRow = async () => {
    const res = await clientAddAttendee({
      sessionId,
      password,
      actorName,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAttendees((prev) => [...prev, res.attendee]);
    toast.success("Added");
  };

  const handleDelete = async (attendeeId: string) => {
    const ok = window.confirm("Remove this attendee?");
    if (!ok) return;

    const res = await clientDeleteAttendee({
      sessionId,
      password,
      actorName,
      attendeeId,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
    toast.success("Removed");
  };

  const handleBulkPaste = async () => {
    const res = await clientBulkPasteAttendees({
      sessionId,
      password,
      actorName,
      linesRaw: bulkText,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAttendees((prev) => [...prev, ...res.attendees]);
    setBulkText("");
    toast.success(`Added ${res.addedCount}`);
  };

  const countryCols = meta?.countries ?? [];

  const createdBy = meta?.createdBy ?? publicMeta.createdBy;

  if (phase === "locked") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-3 text-center animate-fade-in-up">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-brand-gradient opacity-40 blur-2xl" />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-primary">
                <Lock className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Badge variant="gradient">Private invite</Badge>
              <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
                <span className="text-gradient">Unlock</span> attendee list
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Add your name so we can attribute edits, then enter the password
                your PM shared with you.
              </p>
            </div>
          </div>

          <GlassCard
            className="p-7 animate-fade-in-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <InviteBrandLogo className="shrink-0" />
              <LinkCreatorBlock createdBy={createdBy} />
            </div>
            <form className="space-y-5 animate-fade-in-up" style={{ animationDelay: "200ms" }} onSubmit={(e) => void handleUnlock(e)}>
              <div className="space-y-1.5">
                <Label htmlFor="actorName">Your name</Label>
                <Input
                  required
                  id="actorName"
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  maxLength={ACTOR_NAME_MAX}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  required
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                disabled={unlocking}
                className="w-full"
                size="lg"
              >
                {unlocking ? "Unlocking…" : "Unlock"}
              </Button>
            </form>
          </GlassCard>
        </div>
      </main>
    );
  }

  if (!meta) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:pb-14">
      <div className="space-y-8">
        <GlassCard className="overflow-hidden p-0">
          <div className="relative border-b border-border/40 bg-brand-gradient-soft px-6 py-6 sm:px-8 sm:py-7">
            <InviteBrandLogo className="mb-5 sm:mb-6" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 sm:max-w-xl">
                <Badge variant="gradient">{meta.clientName}</Badge>
                <h1 className="font-display text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  <span className="text-gradient">{meta.projectName}</span>
                </h1>
                <p className="text-sm text-muted-foreground text-pretty">
                  Build your attendee matrix by country — we save as you go.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <LinkCreatorBlock createdBy={createdBy} />
                <div className="flex items-center gap-2 self-end rounded-xl glass-surface px-3 py-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold">{attendees.length}</span>
                  <span className="text-muted-foreground">attendees</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--dos-teal)/0.12)] text-[hsl(var(--dos-navy))] ring-1 ring-inset ring-[hsl(var(--dos-teal)/0.25)] dark:text-[hsl(var(--dos-teal))]">
                <ClipboardPaste className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Bulk paste
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Paste any list or table — we add email addresses only. Add names
                  in the matrix below if you need them.
                </p>
              </div>
            </div>
            <Button onClick={() => void handleBulkPaste()}>
              <ClipboardPaste className="h-4 w-4" />
              Bulk paste
            </Button>
          </div>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="mt-4 font-mono text-[13px]"
            placeholder="Paste from Excel, Outlook, or any list — emails only"
          />
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Attendee matrix
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Email is required; name is optional. Toggle invite-all or pick
                countries per person.
              </p>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => void handleAddRow()}
            >
              <Plus className="h-3.5 w-3.5" />
              Add attendee
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="table-head-row sticky top-0 z-20 border-b-[hsl(var(--dos-teal)/0.35)]">
                  <th className="table-head-cell sticky left-0 z-30 min-w-[12rem] bg-background/95 px-3 py-3 backdrop-blur">
                    <span className="block">Name</span>
                    <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
                      optional
                    </span>
                  </th>
                  <th className="table-head-cell min-w-[14rem] px-3 py-3">
                    Email
                  </th>
                  <th className="table-head-cell min-w-[7rem] px-2 py-3 text-center">
                    All
                  </th>
                  {countryCols.map((c) => (
                    <th
                      key={c}
                      className="table-head-cell min-w-[6rem] px-2 py-3 text-center"
                    >
                      {c}
                    </th>
                  ))}
                  <th className="table-head-cell min-w-[3rem] px-2 py-3 text-center" />
                </tr>
              </thead>
              <tbody>
                {attendees.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/30 transition-colors hover:border-l-2 hover:border-l-[hsl(var(--dos-teal)/0.4)] hover:bg-[hsl(var(--dos-teal)/0.03)]",
                      idx % 2 === 1 && "bg-foreground/[0.015]",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-background/40 px-3 py-2 align-middle backdrop-blur">
                      <Input
                        value={row.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAttendees((prev) =>
                            prev.map((a) =>
                              a.id === row.id ? { ...a, name: v } : a,
                            ),
                          );
                          scheduleSave(row.id);
                        }}
                        onBlur={() => void flushSave(row.id)}
                        maxLength={120}
                        placeholder="Optional"
                        className="h-9 placeholder:text-muted-foreground/50"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        type="email"
                        value={row.email}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAttendees((prev) =>
                            prev.map((a) =>
                              a.id === row.id ? { ...a, email: v } : a,
                            ),
                          );
                          scheduleSave(row.id);
                        }}
                        onBlur={() => void flushSave(row.id)}
                        maxLength={255}
                        className="h-9"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="flex justify-center">
                        <Checkbox
                          variant="matrix"
                          checked={row.inviteAll}
                          onCheckedChange={async (checked) => {
                            const v = checked === true;
                            const next: InvitelyAttendee = {
                              ...row,
                              inviteAll: v,
                              selectedCountries: v
                                ? []
                                : row.selectedCountries,
                            };
                            setAttendees((prev) =>
                              prev.map((a) =>
                                a.id === row.id ? next : a,
                              ),
                            );
                            await persistImmediate(next);
                          }}
                          aria-label="Invite to all countries"
                        />
                      </div>
                    </td>
                    {countryCols.map((c) => {
                      const disabled = row.inviteAll;
                      const checked =
                        !disabled && row.selectedCountries.includes(c);
                      return (
                        <td key={c} className="px-2 py-2 align-middle">
                          <div className="flex justify-center">
                            <Checkbox
                              variant="matrix"
                              disabled={disabled}
                              checked={checked}
                              onCheckedChange={async (next) => {
                                if (disabled) return;
                                const on = next === true;
                                const set = new Set(row.selectedCountries);
                                if (on) set.add(c);
                                else set.delete(c);
                                const nextCountries = countryCols.filter(
                                  (x) => set.has(x),
                                );
                                const nextRow: InvitelyAttendee = {
                                  ...row,
                                  inviteAll: false,
                                  selectedCountries: nextCountries,
                                };
                                setAttendees((prev) =>
                                  prev.map((a) =>
                                    a.id === row.id ? nextRow : a,
                                  ),
                                );
                                await persistImmediate(nextRow);
                              }}
                              aria-label={`Invite to ${c}`}
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 align-middle">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove attendee"
                          onClick={() => void handleDelete(row.id)}
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attendees.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No attendees yet. Use{" "}
              <span className="font-medium text-foreground">Add attendee</span>{" "}
              or paste a list above.
            </p>
          ) : null}
        </GlassCard>

        <p className="text-xs text-muted-foreground">
          Bookmark this link for later:{" "}
          <span className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {origin
              ? `${origin}${invitePath(sessionId)}`
              : invitePath(sessionId)}
          </span>
        </p>
      </div>
    </main>
  );
}
