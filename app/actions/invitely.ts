"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { filterCountriesForSession, parseCountryList } from "@/lib/invitely/countries";
import { hashSessionPassword, verifySessionPassword } from "@/lib/invitely/password";
import type {
  InvitelyAttendee,
  InvitelyChangelogEntry,
  InvitelySessionSummary,
} from "@/lib/invitely/types";
import {
  ACTOR_NAME_MAX,
  EMAIL_MAX,
  isValidEmail,
  NAME_MAX,
  normalizeWhitespace,
} from "@/lib/invitely/validation";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id: string) {
  if (!UUID_RE.test(id)) throw new Error("Invalid session id.");
}

type DbSessionRow = {
  id: string;
  clerk_user_id: string;
  client_name: string;
  project_name: string;
  countries: string[];
  password_hash: string;
  created_at: string;
};

type DbAttendeeRow = {
  id: string;
  session_id: string;
  name: string;
  email: string;
  invite_all: boolean;
  selected_countries: string[];
  updated_at: string;
};

type DbChangelogRow = {
  id: string;
  actor_name: string;
  action: string;
  attendee_label: string;
  invite_all: boolean | null;
  selected_countries: string[] | null;
  created_at: string;
};

function mapSummary(row: Omit<DbSessionRow, "password_hash" | "clerk_user_id">): InvitelySessionSummary {
  return {
    id: row.id,
    clientName: row.client_name,
    projectName: row.project_name,
    countries: row.countries ?? [],
    createdAt: row.created_at,
  };
}

function mapAttendee(row: DbAttendeeRow): InvitelyAttendee {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    email: row.email,
    inviteAll: row.invite_all,
    selectedCountries: row.selected_countries ?? [],
    updatedAt: row.updated_at,
  };
}

function mapChangelog(row: DbChangelogRow): InvitelyChangelogEntry {
  return {
    id: row.id,
    actorName: row.actor_name,
    action: row.action as InvitelyChangelogEntry["action"],
    attendeeLabel: row.attendee_label,
    inviteAll: row.invite_all,
    selectedCountries: row.selected_countries,
    createdAt: row.created_at,
  };
}

function attendeeDisplayLabel(name: string, email: string) {
  const n = normalizeWhitespace(name);
  const e = normalizeWhitespace(email);
  if (n && e) return `${n} <${e}>`;
  if (n) return n;
  if (e) return e;
  return "New attendee";
}

async function appendChangelog(input: {
  sessionId: string;
  actorName: string;
  action: InvitelyChangelogEntry["action"];
  attendeeId: string | null;
  attendeeLabel: string;
  inviteAll: boolean | null;
  selectedCountries: string[] | null;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("invite_changelog").insert({
    session_id: input.sessionId,
    actor_name: input.actorName,
    action: input.action,
    attendee_id: input.attendeeId,
    attendee_label: input.attendeeLabel,
    invite_all: input.inviteAll,
    selected_countries: input.selectedCountries,
  });
  if (error) throw new Error(error.message);
}

async function loadSessionForClient(sessionId: string) {
  assertUuid(sessionId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invite_sessions")
    .select(
      "id, password_hash, countries, project_name, client_name, created_at",
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Pick<
    DbSessionRow,
    | "id"
    | "password_hash"
    | "countries"
    | "project_name"
    | "client_name"
    | "created_at"
  > | null;
}

async function verifyClientPassword(sessionId: string, password: string) {
  const session = await loadSessionForClient(sessionId);
  if (!session) return { ok: false as const, reason: "not_found" as const };
  const valid = await verifySessionPassword(password, session.password_hash);
  if (!valid) return { ok: false as const, reason: "bad_password" as const };
  return { ok: true as const, session };
}

export async function createInviteSession(input: {
  clientName: string;
  projectName: string;
  countriesRaw: string;
  password: string;
}) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Sign in required." };

  const clientName = normalizeWhitespace(input.clientName);
  const projectName = normalizeWhitespace(input.projectName);
  const countries = parseCountryList(input.countriesRaw);
  const password = input.password;

  if (!clientName) return { ok: false as const, error: "Client name is required." };
  if (!projectName) return { ok: false as const, error: "Project name is required." };
  if (countries.length === 0) {
    return { ok: false as const, error: "Add at least one country." };
  }
  if (password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters." };
  }

  const passwordHash = await hashSessionPassword(password);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invite_sessions")
    .insert({
      clerk_user_id: userId,
      client_name: clientName,
      project_name: projectName,
      countries,
      password_hash: passwordHash,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/project-management/invitely");
  return { ok: true as const, sessionId: data.id as string };
}

export async function listInviteSessions(): Promise<
  InvitelySessionSummary[] | { error: string }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invite_sessions")
    .select("id, client_name, project_name, countries, created_at")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return (data ?? []).map((row) =>
    mapSummary(row as Omit<DbSessionRow, "password_hash" | "clerk_user_id">),
  );
}

export async function deleteInviteSession(sessionId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Sign in required." };
  assertUuid(sessionId);

  const supabase = createAdminClient();
  const { data: existing, error: findError } = await supabase
    .from("invite_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (findError) return { ok: false as const, error: findError.message };
  if (!existing) return { ok: false as const, error: "Session not found." };

  const { error } = await supabase
    .from("invite_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("clerk_user_id", userId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/project-management/invitely");
  revalidatePath(`/project-management/invitely/sessions/${sessionId}`);
  return { ok: true as const };
}

export type PmSessionDetail = {
  session: InvitelySessionSummary;
  attendees: InvitelyAttendee[];
  changelog: InvitelyChangelogEntry[];
};

export async function getInviteSessionForPm(
  sessionId: string,
): Promise<PmSessionDetail | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };
  assertUuid(sessionId);

  const supabase = createAdminClient();
  const { data: sessionRow, error: sessionError } = await supabase
    .from("invite_sessions")
    .select("id, client_name, project_name, countries, created_at")
    .eq("id", sessionId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (sessionError) return { error: sessionError.message };
  if (!sessionRow) return { error: "Session not found." };

  const { data: attendeeRows, error: attendeeError } = await supabase
    .from("invite_attendees")
    .select(
      "id, session_id, name, email, invite_all, selected_countries, updated_at",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (attendeeError) return { error: attendeeError.message };

  const { data: logRows, error: logError } = await supabase
    .from("invite_changelog")
    .select(
      "id, actor_name, action, attendee_label, invite_all, selected_countries, created_at",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (logError) return { error: logError.message };

  return {
    session: mapSummary(sessionRow as Omit<DbSessionRow, "password_hash" | "clerk_user_id">),
    attendees: (attendeeRows ?? []).map((r) => mapAttendee(r as DbAttendeeRow)),
    changelog: (logRows ?? []).map((r) => mapChangelog(r as DbChangelogRow)),
  };
}

export async function unlockInviteSession(input: {
  sessionId: string;
  password: string;
}) {
  const sessionId = input.sessionId;
  assertUuid(sessionId);
  const verified = await verifyClientPassword(sessionId, input.password);
  if (!verified.ok) {
    if (verified.reason === "bad_password") {
      return { ok: false as const, error: "Incorrect password." };
    }
    return { ok: false as const, error: "Session not found." };
  }

  const supabase = createAdminClient();
  const { data: attendeeRows, error } = await supabase
    .from("invite_attendees")
    .select(
      "id, session_id, name, email, invite_all, selected_countries, updated_at",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false as const, error: error.message };

  return {
    ok: true as const,
    session: {
      id: verified.session.id,
      projectName: verified.session.project_name,
      clientName: verified.session.client_name,
      countries: verified.session.countries ?? [],
    },
    attendees: (attendeeRows ?? []).map((r) => mapAttendee(r as DbAttendeeRow)),
  };
}

export async function clientAddAttendee(input: {
  sessionId: string;
  password: string;
  actorName: string;
}) {
  const actorName = normalizeWhitespace(input.actorName);
  if (!actorName || actorName.length > ACTOR_NAME_MAX) {
    return { ok: false as const, error: "Enter your name to record changes." };
  }

  const verified = await verifyClientPassword(input.sessionId, input.password);
  if (!verified.ok) {
    return {
      ok: false as const,
      error:
        verified.reason === "bad_password" ? "Incorrect password." : "Session not found.",
    };
  }

  const supabase = createAdminClient();
  const { data: inserted, error } = await supabase
    .from("invite_attendees")
    .insert({
      session_id: input.sessionId,
      name: "",
      email: "",
      invite_all: false,
      selected_countries: [],
    })
    .select(
      "id, session_id, name, email, invite_all, selected_countries, updated_at",
    )
    .single();

  if (error) return { ok: false as const, error: error.message };

  const row = mapAttendee(inserted as DbAttendeeRow);
  await appendChangelog({
    sessionId: input.sessionId,
    actorName,
    action: "add",
    attendeeId: row.id,
    attendeeLabel: attendeeDisplayLabel(row.name, row.email),
    inviteAll: row.inviteAll,
    selectedCountries: row.selectedCountries,
  });

  revalidatePath("/project-management/invitely");
  revalidatePath(`/project-management/invitely/sessions/${input.sessionId}`);
  return { ok: true as const, attendee: row };
}

export async function clientUpdateAttendee(input: {
  sessionId: string;
  password: string;
  actorName: string;
  attendeeId: string;
  name: string;
  email: string;
  inviteAll: boolean;
  selectedCountries: string[];
}) {
  const actorName = normalizeWhitespace(input.actorName);
  if (!actorName || actorName.length > ACTOR_NAME_MAX) {
    return { ok: false as const, error: "Enter your name to record changes." };
  }

  const verified = await verifyClientPassword(input.sessionId, input.password);
  if (!verified.ok) {
    return {
      ok: false as const,
      error:
        verified.reason === "bad_password" ? "Incorrect password." : "Session not found.",
    };
  }

  const name = normalizeWhitespace(input.name);
  const email = normalizeWhitespace(input.email);

  if (name.length > NAME_MAX) {
    return { ok: false as const, error: `Name must be at most ${NAME_MAX} characters.` };
  }
  if (email.length > EMAIL_MAX) {
    return { ok: false as const, error: `Email must be at most ${EMAIL_MAX} characters.` };
  }
  if (email && !isValidEmail(email)) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  const inviteAll = input.inviteAll;
  const selectedCountries = inviteAll
    ? []
    : filterCountriesForSession(verified.session.countries ?? [], input.selectedCountries);

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("invite_attendees")
    .select("id, session_id")
    .eq("id", input.attendeeId)
    .eq("session_id", input.sessionId)
    .maybeSingle();

  if (fetchError) return { ok: false as const, error: fetchError.message };
  if (!existing) return { ok: false as const, error: "Attendee not found." };

  const { data: updated, error } = await supabase
    .from("invite_attendees")
    .update({
      name,
      email,
      invite_all: inviteAll,
      selected_countries: selectedCountries,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.attendeeId)
    .eq("session_id", input.sessionId)
    .select(
      "id, session_id, name, email, invite_all, selected_countries, updated_at",
    )
    .single();

  if (error) return { ok: false as const, error: error.message };

  const row = mapAttendee(updated as DbAttendeeRow);
  await appendChangelog({
    sessionId: input.sessionId,
    actorName,
    action: "update",
    attendeeId: row.id,
    attendeeLabel: attendeeDisplayLabel(row.name, row.email),
    inviteAll: row.inviteAll,
    selectedCountries: row.selectedCountries,
  });

  revalidatePath("/project-management/invitely");
  revalidatePath(`/project-management/invitely/sessions/${input.sessionId}`);
  return { ok: true as const, attendee: row };
}

export async function clientDeleteAttendee(input: {
  sessionId: string;
  password: string;
  actorName: string;
  attendeeId: string;
}) {
  const actorName = normalizeWhitespace(input.actorName);
  if (!actorName || actorName.length > ACTOR_NAME_MAX) {
    return { ok: false as const, error: "Enter your name to record changes." };
  }

  const verified = await verifyClientPassword(input.sessionId, input.password);
  if (!verified.ok) {
    return {
      ok: false as const,
      error:
        verified.reason === "bad_password" ? "Incorrect password." : "Session not found.",
    };
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("invite_attendees")
    .select(
      "id, session_id, name, email, invite_all, selected_countries",
    )
    .eq("id", input.attendeeId)
    .eq("session_id", input.sessionId)
    .maybeSingle();

  if (fetchError) return { ok: false as const, error: fetchError.message };
  if (!existing) return { ok: false as const, error: "Attendee not found." };

  const label = attendeeDisplayLabel(existing.name, existing.email);

  const { error: deleteError } = await supabase
    .from("invite_attendees")
    .delete()
    .eq("id", input.attendeeId)
    .eq("session_id", input.sessionId);

  if (deleteError) return { ok: false as const, error: deleteError.message };

  await appendChangelog({
    sessionId: input.sessionId,
    actorName,
    action: "delete",
    attendeeId: null,
    attendeeLabel: label,
    inviteAll: existing.invite_all,
    selectedCountries: existing.selected_countries ?? [],
  });

  revalidatePath("/project-management/invitely");
  revalidatePath(`/project-management/invitely/sessions/${input.sessionId}`);
  return { ok: true as const };
}

export async function clientBulkPasteAttendees(input: {
  sessionId: string;
  password: string;
  actorName: string;
  linesRaw: string;
}) {
  const actorName = normalizeWhitespace(input.actorName);
  if (!actorName || actorName.length > ACTOR_NAME_MAX) {
    return { ok: false as const, error: "Enter your name to record changes." };
  }

  const verified = await verifyClientPassword(input.sessionId, input.password);
  if (!verified.ok) {
    return {
      ok: false as const,
      error:
        verified.reason === "bad_password" ? "Incorrect password." : "Session not found.",
    };
  }

  const lines = input.linesRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: { name: string; email: string }[] = [];
  for (const line of lines) {
    const idx = line.indexOf(",");
    if (idx === -1) continue;
    const name = normalizeWhitespace(line.slice(0, idx));
    const email = normalizeWhitespace(line.slice(idx + 1));
    if (!name || name.length > NAME_MAX) continue;
    if (!email || email.length > EMAIL_MAX || !isValidEmail(email)) continue;
    parsed.push({ name, email });
  }

  if (parsed.length === 0) {
    return { ok: false as const, error: "No valid lines found. Use: Name, email" };
  }

  const supabase = createAdminClient();
  const insertedRows: InvitelyAttendee[] = [];

  for (const row of parsed) {
    const { data: inserted, error } = await supabase
      .from("invite_attendees")
      .insert({
        session_id: input.sessionId,
        name: row.name,
        email: row.email,
        invite_all: false,
        selected_countries: [],
      })
      .select(
        "id, session_id, name, email, invite_all, selected_countries, updated_at",
      )
      .single();

    if (error) return { ok: false as const, error: error.message };
    const mapped = mapAttendee(inserted as DbAttendeeRow);
    insertedRows.push(mapped);
    await appendChangelog({
      sessionId: input.sessionId,
      actorName,
      action: "add",
      attendeeId: mapped.id,
      attendeeLabel: attendeeDisplayLabel(mapped.name, mapped.email),
      inviteAll: mapped.inviteAll,
      selectedCountries: mapped.selectedCountries,
    });
  }

  revalidatePath("/project-management/invitely");
  revalidatePath(`/project-management/invitely/sessions/${input.sessionId}`);
  return { ok: true as const, attendees: insertedRows, addedCount: insertedRows.length };
}
