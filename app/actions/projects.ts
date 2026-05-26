"use server";

import { revalidatePath } from "next/cache";

import {
  canAccessOwnedResource,
  ownerClerkIdFilter,
} from "@/lib/auth/access";
import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import { isAllowedInvitelyMarket } from "@/lib/invitely/countries";
import { normalizeWhitespace } from "@/lib/invitely/validation";
import {
  normalizeProjectSpecs,
  validateProjectSpecsInput,
  type ProjectSpecs,
} from "@/lib/projects/project-specs";
import type { Project, ProjectSummary } from "@/lib/projects/types";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id: string) {
  if (!UUID_RE.test(id)) throw new Error("Invalid project id.");
}

type DbProjectRow = {
  id: string;
  clerk_user_id: string;
  client_name: string;
  project_number: string;
  project_name: string;
  markets: string[];
  project_specs?: unknown;
  created_at: string;
};

const PROJECT_SELECT =
  "id, clerk_user_id, client_name, project_number, project_name, markets, project_specs, created_at";

function projectSpecsSchemaHint(errorMessage: string): string | null {
  if (/project_specs/i.test(errorMessage) && /column|schema cache/i.test(errorMessage)) {
    return "Database schema is out of date. Run migration 016_project_specs.sql in the Supabase SQL editor, then try again.";
  }
  return null;
}

function mapSummary(
  row: DbProjectRow,
  ownerDisplayName: string,
): ProjectSummary {
  return {
    id: row.id,
    clientName: row.client_name,
    projectNumber: row.project_number,
    projectName: row.project_name,
    markets: row.markets ?? [],
    createdAt: row.created_at,
    ownerClerkUserId: row.clerk_user_id,
    ownerDisplayName,
  };
}

function mapProject(row: DbProjectRow, ownerDisplayName: string): Project {
  return {
    ...mapSummary(row, ownerDisplayName),
    projectSpecs: normalizeProjectSpecs(row.project_specs),
  };
}

async function resolveOwnerDisplayNames(
  supabase: ReturnType<typeof createAdminClient>,
  clerkUserIds: string[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(clerkUserIds.filter(Boolean)));
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("app_users")
    .select("clerk_user_id, display_name, email")
    .in("clerk_user_id", unique);

  if (error) return map;

  for (const row of data ?? []) {
    const id = row.clerk_user_id as string | null;
    if (!id) continue;
    const name =
      (typeof row.display_name === "string" && row.display_name.trim()) ||
      (typeof row.email === "string" && row.email.trim()) ||
      "";
    if (name) map.set(id, name);
  }
  return map;
}

function ownerLabel(
  clerkUserId: string,
  owners: Map<string, string>,
): string {
  return owners.get(clerkUserId) ?? "Unknown";
}

function validateMarkets(markets: unknown): string[] {
  if (!Array.isArray(markets)) {
    throw new Error("Markets must be a non-empty list.");
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of markets) {
    if (typeof m !== "string") continue;
    const label = normalizeWhitespace(m);
    if (!label) continue;
    if (!isAllowedInvitelyMarket(label)) {
      throw new Error(`Invalid market: ${label}`);
    }
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  if (out.length === 0) {
    throw new Error("Select at least one market.");
  }
  return out;
}

export async function createProject(input: {
  clientName: string;
  projectNumber: string;
  projectName: string;
  markets: string[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const appUser = await getActiveAppUserForAction();
    if ("error" in appUser) return { ok: false, error: appUser.error };
    const userId = appUser.clerkUserId!;

    const clientName = normalizeWhitespace(input.clientName);
    const projectNumber = normalizeWhitespace(input.projectNumber);
    const projectName = normalizeWhitespace(input.projectName);

    if (!clientName) return { ok: false, error: "Client is required." };
    if (!projectNumber) return { ok: false, error: "Project number is required." };
    if (!projectName) return { ok: false, error: "Project name is required." };

    let markets: string[];
    try {
      markets = validateMarkets(input.markets);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Invalid markets.",
      };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        clerk_user_id: userId,
        client_name: clientName,
        project_number: projectNumber,
        project_name: projectName,
        markets,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/projects");
    revalidatePath("/dashboard/projects");
    revalidatePath("/screener-studio/projects");
    revalidatePath("/invitely");
    return { ok: true, id: data.id as string };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create project.",
    };
  }
}

export async function listProjects(): Promise<
  ProjectSummary[] | { error: string }
> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return { error: appUser.error };

  const supabase = createAdminClient();
  let query = supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("created_at", { ascending: false });

  const ownerFilter = ownerClerkIdFilter(appUser);
  if (ownerFilter) {
    query = query.eq("clerk_user_id", ownerFilter);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };
  const rows = (data ?? []) as DbProjectRow[];
  const owners = await resolveOwnerDisplayNames(
    supabase,
    rows.map((r) => r.clerk_user_id),
  );
  return rows.map((row) => mapSummary(row, ownerLabel(row.clerk_user_id, owners)));
}

export async function getProject(id: string): Promise<Project> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) throw new Error(appUser.error);
  assertUuid(id);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Project not found.");
  const row = data as DbProjectRow;
  if (!canAccessOwnedResource(appUser, row.clerk_user_id)) {
    throw new Error("Project not found.");
  }

  const owners = await resolveOwnerDisplayNames(supabase, [row.clerk_user_id]);
  return mapProject(row, ownerLabel(row.clerk_user_id, owners));
}

export async function updateProject(input: {
  id: string;
  clientName: string;
  projectNumber: string;
  projectName: string;
  markets: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const appUser = await getActiveAppUserForAction();
    if ("error" in appUser) return { ok: false, error: appUser.error };
    assertUuid(input.id);

    const clientName = normalizeWhitespace(input.clientName);
    const projectNumber = normalizeWhitespace(input.projectNumber);
    const projectName = normalizeWhitespace(input.projectName);

    if (!clientName) return { ok: false, error: "Client is required." };
    if (!projectNumber) {
      return { ok: false, error: "Project number is required." };
    }
    if (!projectName) return { ok: false, error: "Project name is required." };

    let markets: string[];
    try {
      markets = validateMarkets(input.markets);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Invalid markets.",
      };
    }

    const supabase = createAdminClient();
    const { data: existing, error: findError } = await supabase
      .from("projects")
      .select("id, clerk_user_id")
      .eq("id", input.id)
      .maybeSingle();

    if (findError) return { ok: false, error: findError.message };
    if (
      !existing ||
      !canAccessOwnedResource(
        appUser,
        (existing as { clerk_user_id: string }).clerk_user_id,
      )
    ) {
      return { ok: false, error: "Project not found." };
    }

    const { error } = await supabase
      .from("projects")
      .update({
        client_name: clientName,
        project_number: projectNumber,
        project_name: projectName,
        markets,
      })
      .eq("id", input.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/projects");
    revalidatePath(`/projects/${input.id}`);
    revalidatePath("/screener-studio/projects");
    revalidatePath("/invitely");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not update project.",
    };
  }
}

export async function updateProjectSpecs(input: {
  projectId: string;
  screenerId?: string;
  specs: ProjectSpecs;
}): Promise<
  { ok: true; specs: ProjectSpecs } | { ok: false; error: string }
> {
  try {
    const appUser = await getActiveAppUserForAction();
    if ("error" in appUser) return { ok: false, error: appUser.error };
    assertUuid(input.projectId);

    const validated = validateProjectSpecsInput(input.specs);
    if (!validated.ok) return validated;

    const supabase = createAdminClient();
    const { data: existing, error: findError } = await supabase
      .from("projects")
      .select("id, clerk_user_id")
      .eq("id", input.projectId)
      .maybeSingle();

    if (findError) {
      const hint = projectSpecsSchemaHint(findError.message);
      return { ok: false, error: hint ?? findError.message };
    }
    if (
      !existing ||
      !canAccessOwnedResource(
        appUser,
        (existing as { clerk_user_id: string }).clerk_user_id,
      )
    ) {
      return { ok: false, error: "Project not found." };
    }

    const { error } = await supabase
      .from("projects")
      .update({ project_specs: validated.specs })
      .eq("id", input.projectId);

    if (error) {
      const hint = projectSpecsSchemaHint(error.message);
      return { ok: false, error: hint ?? error.message };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${input.projectId}`);
    revalidatePath("/screener-studio/projects");
    revalidatePath("/workspace/screener-studio");
    if (input.screenerId) {
      revalidatePath(`/workspace/screener-studio/${input.screenerId}`);
    }

    return { ok: true, specs: validated.specs };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not save project specs.",
    };
  }
}

export async function deleteProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return { ok: false, error: appUser.error };
  assertUuid(id);

  const supabase = createAdminClient();
  const { data: existing, error: findError } = await supabase
    .from("projects")
    .select("id, clerk_user_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return { ok: false, error: findError.message };
  if (
    !existing ||
    !canAccessOwnedResource(
      appUser,
      (existing as { clerk_user_id: string }).clerk_user_id,
    )
  ) {
    return { ok: false, error: "Project not found." };
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/screener-studio/projects");
  return { ok: true };
}
