"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardPaste,
  Globe,
  Lock,
  Plus,
  Sparkles,
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
import type { InvitelyAttendee } from "@/lib/invitely/types";
import { ACTOR_NAME_MAX } from "@/lib/invitely/validation";

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

export function InviteSessionClient({ sessionId }: { sessionId: string }) {
  const [phase, setPhase] = useState<"locked" | "open">("locked");
  const [actorName, setActorName] = useState("");
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [meta, setMeta] = useState<{
    projectName: string;
    clientName: string;
    countries: string[];
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

  if (phase === "locked") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
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
              <h1 className="text-3xl font-bold tracking-tight text-balance">
                <span className="text-gradient">Unlock</span> attendee list
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your name so changes can be attributed, then use the
                password your PM shared.
              </p>
            </div>
          </div>

          <GlassCard className="p-7 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <form className="space-y-5" onSubmit={(e) => void handleUnlock(e)}>
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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="space-y-8">
        <GlassCard className="overflow-hidden p-0">
          <div className="relative border-b border-border/40 bg-brand-gradient-soft px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Badge variant="gradient">{meta.clientName}</Badge>
                <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  <span className="text-gradient">{meta.projectName}</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Build the attendee matrix per country. Changes save
                  automatically.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-xl glass-surface px-3 py-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold">
                    {meta.countries.length}
                  </span>
                  <span className="text-muted-foreground">countries</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl glass-surface px-3 py-1.5 text-xs">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft text-foreground ring-1 ring-inset ring-primary/20">
                <ClipboardPaste className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Bulk paste
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  One per line:{" "}
                  <span className="font-mono text-[11px] text-foreground">
                    Jane Doe, jane@acme.com
                  </span>
                </p>
              </div>
            </div>
            <Button onClick={() => void handleBulkPaste()}>
              <Sparkles className="h-4 w-4" />
              Parse into rows
            </Button>
          </div>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="mt-4 font-mono text-[13px]"
            placeholder="Jane Doe, jane@acme.com&#10;John Smith, john@beta.io"
          />
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Attendee matrix
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Toggle invite-all or pick specific countries for each person.
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
                <tr className="border-b border-border/40 bg-background/30 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">
                  <th className="sticky left-0 z-10 min-w-[12rem] bg-background/30 px-3 py-3 backdrop-blur">
                    Name
                  </th>
                  <th className="min-w-[14rem] px-3 py-3">Email</th>
                  <th className="min-w-[7rem] px-2 py-3 text-center">
                    All
                  </th>
                  {countryCols.map((c) => (
                    <th
                      key={c}
                      className="min-w-[6rem] px-2 py-3 text-center"
                    >
                      {c}
                    </th>
                  ))}
                  <th className="min-w-[3rem] px-2 py-3 text-center" />
                </tr>
              </thead>
              <tbody>
                {attendees.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/30 transition-colors hover:bg-foreground/[0.02]",
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
                        className="h-9"
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
