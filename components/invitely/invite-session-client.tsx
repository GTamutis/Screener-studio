"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  clientAddAttendee,
  clientBulkPasteAttendees,
  clientDeleteAttendee,
  clientUpdateAttendee,
  unlockInviteSession,
} from "@/app/actions/invitely";
import type { InvitelyAttendee } from "@/lib/invitely/types";
import { ACTOR_NAME_MAX } from "@/lib/invitely/validation";
import { Trash2 } from "lucide-react";

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
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-900/5 backdrop-blur">
          <h1 className="text-xl font-semibold text-slate-900">
            Unlock attendee list
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your name so changes can be attributed, then use the password your PM
            shared.
          </p>
          <form className="mt-6 space-y-4" onSubmit={(e) => void handleUnlock(e)}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Your name
              </label>
              <input
                required
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                maxLength={ACTOR_NAME_MAX}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
              />
            </div>
            <button
              type="submit"
              disabled={unlocking}
              className="w-full rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {unlocking ? "Unlocking…" : "Unlock"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!meta) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-slate-900">
              {meta.projectName}
            </h1>
            <p className="text-sm text-slate-600">
              Client:{" "}
              <span className="font-medium text-slate-800">{meta.clientName}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Bulk paste
              </h2>
              <p className="text-xs text-slate-600">
                One per line:{" "}
                <span className="font-mono text-[11px]">Jane Doe, jane@acme.com</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleBulkPaste()}
              className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-900"
            >
              Parse into rows
            </button>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none ring-blue-950/20 transition focus:border-blue-950/40 focus:ring-4"
            placeholder="Jane Doe, jane@acme.com"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Attendee matrix
            </h2>
            <button
              type="button"
              onClick={() => void handleAddRow()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Add attendee
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-600">
                  <th className="min-w-[12rem] px-3 py-3 font-semibold">Name</th>
                  <th className="min-w-[14rem] px-3 py-3 font-semibold">Email</th>
                  <th className="min-w-[7rem] px-2 py-3 text-center font-semibold">
                    Invite to all
                  </th>
                  {countryCols.map((c) => (
                    <th
                      key={c}
                      className="min-w-[6rem] px-2 py-3 text-center font-semibold"
                    >
                      {c}
                    </th>
                  ))}
                  <th className="min-w-[3rem] px-2 py-3 text-center font-semibold">
                    {" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 align-middle">
                      <input
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
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
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
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-inner outline-none ring-blue-950/15 focus:border-blue-950/35 focus:ring-4"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={row.inviteAll}
                          onChange={async (e) => {
                            const checked = e.target.checked;
                            const next: InvitelyAttendee = {
                              ...row,
                              inviteAll: checked,
                              selectedCountries: checked ? [] : row.selectedCountries,
                            };
                            setAttendees((prev) =>
                              prev.map((a) => (a.id === row.id ? next : a)),
                            );
                            await persistImmediate(next);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-950 focus:ring-blue-950/40"
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
                            <input
                              type="checkbox"
                              disabled={disabled}
                              checked={checked}
                              onChange={async (e) => {
                                if (disabled) return;
                                const on = e.target.checked;
                                const set = new Set(row.selectedCountries);
                                if (on) set.add(c);
                                else set.delete(c);
                                const nextCountries = countryCols.filter((x) =>
                                  set.has(x),
                                );
                                const next: InvitelyAttendee = {
                                  ...row,
                                  inviteAll: false,
                                  selectedCountries: nextCountries,
                                };
                                setAttendees((prev) =>
                                  prev.map((a) =>
                                    a.id === row.id ? next : a,
                                  ),
                                );
                                await persistImmediate(next);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-950 focus:ring-blue-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 align-middle">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          aria-label="Remove attendee"
                          onClick={() => void handleDelete(row.id)}
                          className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attendees.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-600">
              No attendees yet. Use{" "}
              <span className="font-medium text-slate-800">Add attendee</span> or bulk
              paste.
            </p>
          ) : null}
        </div>

        <p className="text-xs text-slate-600">
          Bookmark this link for later:{" "}
          <span className="font-mono text-[11px] text-slate-800">
            {origin ? `${origin}${invitePath(sessionId)}` : invitePath(sessionId)}
          </span>
        </p>
      </div>
    </main>
  );
}
