"use server";

import { revalidatePath } from "next/cache";

import { getProject, listProjects } from "@/app/actions/projects";
import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import { normalizeWhitespace } from "@/lib/invitely/validation";
import type {
  RecentScreenerSummary,
  ScreenerStatus,
  ScreenerSummary,
  ScreenerWithProject,
} from "@/lib/screeners/types";
import {
  versionFieldsAfterSave,
  versionFieldsAfterSetDraft,
  versionFieldsAfterSetFinal,
} from "@/lib/screeners/version";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SCREENER_NAME_MAX = 200;

function assertUuid(id: string, label = "id") {
  if (!UUID_RE.test(id)) throw new Error(`Invalid ${label}.`);
}

type DbScreenerRow = {
  id: string;
  project_id: string;
  name: string;
  status: ScreenerStatus;
  major_version: number;
  minor_version: number;
  created_at: string;
  updated_at: string;
};

const SCREENER_SELECT =
  "id, project_id, name, status, major_version, minor_version, created_at, updated_at";

function mapScreener(row: DbScreenerRow): ScreenerSummary {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    status: row.status,
    majorVersion: row.major_version,
    minorVersion: row.minor_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type DbRecentScreenerRow = {
  id: string;
  name: string;
  status: ScreenerStatus;
  major_version: number;
  minor_version: number;
  updated_at: string;
  created_by: string;
  projects:
    | {
        client_name: string;
        project_name: string;
        project_number: string;
      }
    | {
        client_name: string;
        project_name: string;
        project_number: string;
      }[];
};

function appUserDisplayName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name =
    (typeof displayName === "string" && displayName.trim()) ||
    (typeof email === "string" && email.trim()) ||
    "";
  return name || "Unknown";
}

async function resolveAppUserDisplayNames(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("app_users")
    .select("id, display_name, email")
    .in("id", unique);

  if (error) return map;

  for (const row of data ?? []) {
    const id = row.id as string | null;
    if (!id) continue;
    map.set(
      id,
      appUserDisplayName(
        row.display_name as string | null,
        row.email as string | null,
      ),
    );
  }
  return map;
}

export async function listRecentScreeners(
  limit = 12,
): Promise<RecentScreenerSummary[] | { error: string }> {
  try {
    const projectsResult = await listProjects();
    if ("error" in projectsResult) return { error: projectsResult.error };

    const projectIds = projectsResult.map((p) => p.id);
    if (projectIds.length === 0) return [];

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .select(
        "id, name, status, major_version, minor_version, updated_at, created_by, projects!inner(client_name, project_name, project_number)",
      )
      .in("project_id", projectIds)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) return { error: error.message };

    const rows = (data ?? []) as DbRecentScreenerRow[];
    const ownerNames = await resolveAppUserDisplayNames(
      supabase,
      rows.map((row) => row.created_by),
    );

    return rows.map((row) => {
      const project = Array.isArray(row.projects)
        ? row.projects[0]
        : row.projects;
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        majorVersion: row.major_version,
        minorVersion: row.minor_version,
        clientName: project?.client_name ?? "—",
        projectName: project?.project_name ?? "—",
        projectNumber: project?.project_number ?? "—",
        ownerDisplayName: ownerNames.get(row.created_by) ?? "Unknown",
        updatedAt: row.updated_at,
      };
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not load screeners.",
    };
  }
}

export async function listScreenersForProject(
  projectId: string,
): Promise<ScreenerSummary[] | { error: string }> {
  try {
    await getProject(projectId);
    assertUuid(projectId, "project id");

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .select(SCREENER_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return (data ?? []).map((row) => mapScreener(row as DbScreenerRow));
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not load screeners.",
    };
  }
}

export async function createScreener(input: {
  projectId: string;
  name: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const appUser = await getActiveAppUserForAction();
    if ("error" in appUser) return { ok: false, error: appUser.error };

    assertUuid(input.projectId, "project id");

    const name = normalizeWhitespace(input.name);
    if (!name) return { ok: false, error: "Screener name is required." };
    if (name.length > SCREENER_NAME_MAX) {
      return {
        ok: false,
        error: `Screener name must be ${SCREENER_NAME_MAX} characters or fewer.`,
      };
    }

    await getProject(input.projectId);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .insert({
        project_id: input.projectId,
        name,
        status: "draft",
        major_version: 0,
        minor_version: 0,
        created_by: appUser.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    const screenerId = data.id as string;
    revalidatePath(`/dashboard/projects/${input.projectId}`);
    revalidatePath(`/projects/${input.projectId}`);
    revalidatePath("/screener-studio");
    revalidatePath(
      `/dashboard/projects/${input.projectId}/screeners/${screenerId}`,
    );
    revalidatePath(`/workspace/screener-studio/${screenerId}`);

    return { ok: true, id: screenerId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create screener.",
    };
  }
}

export async function getScreener(
  projectId: string,
  screenerId: string,
): Promise<ScreenerSummary> {
  assertUuid(projectId, "project id");
  assertUuid(screenerId, "screener id");

  await getProject(projectId);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("screeners")
    .select(SCREENER_SELECT)
    .eq("id", screenerId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Screener not found.");

  return mapScreener(data as DbScreenerRow);
}

export async function getScreenerById(
  screenerId: string,
): Promise<ScreenerWithProject> {
  assertUuid(screenerId, "screener id");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("screeners")
    .select(SCREENER_SELECT)
    .eq("id", screenerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Screener not found.");

  const row = data as DbScreenerRow;
  const project = await getProject(row.project_id);
  const screener = mapScreener(row);

  return {
    ...screener,
    clientName: project.clientName,
    projectName: project.projectName,
    projectNumber: project.projectNumber,
    markets: project.markets ?? [],
    projectSpecs: project.projectSpecs,
  };
}

export type ScreenerVersionSnapshot = Pick<
  ScreenerSummary,
  "status" | "majorVersion" | "minorVersion" | "updatedAt"
>;

export async function touchScreenerSave(
  screenerId: string,
): Promise<
  { ok: true; screener: ScreenerVersionSnapshot } | { ok: false; error: string }
> {
  try {
    assertUuid(screenerId, "screener id");
    const current = await getScreenerById(screenerId);
    const versionUpdate = versionFieldsAfterSave({
      status: current.status,
      majorVersion: current.majorVersion,
      minorVersion: current.minorVersion,
    });

    const updatedAt = new Date().toISOString();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .update({
        updated_at: updatedAt,
        ...("status" in versionUpdate
          ? { status: versionUpdate.status }
          : {}),
        minor_version: versionUpdate.minorVersion,
      })
      .eq("id", screenerId)
      .select("status, major_version, minor_version, updated_at")
      .single();

    if (error) return { ok: false, error: error.message };

    const row = data as {
      status: ScreenerStatus;
      major_version: number;
      minor_version: number;
      updated_at: string;
    };

    revalidateScreenerPaths(screenerId, current.projectId);
    return {
      ok: true,
      screener: {
        status: row.status,
        majorVersion: row.major_version,
        minorVersion: row.minor_version,
        updatedAt: row.updated_at,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save screener.",
    };
  }
}

export async function setScreenerToFinal(
  screenerId: string,
): Promise<
  { ok: true; screener: ScreenerVersionSnapshot } | { ok: false; error: string }
> {
  try {
    assertUuid(screenerId, "screener id");
    const current = await getScreenerById(screenerId);
    if (current.status === "final") {
      return { ok: false, error: "Screener is already final." };
    }

    const versionUpdate = versionFieldsAfterSetFinal({
      majorVersion: current.majorVersion,
    });
    const updatedAt = new Date().toISOString();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .update({
        status: versionUpdate.status,
        major_version: versionUpdate.majorVersion,
        minor_version: versionUpdate.minorVersion,
        updated_at: updatedAt,
      })
      .eq("id", screenerId)
      .select("status, major_version, minor_version, updated_at")
      .single();

    if (error) return { ok: false, error: error.message };

    const row = data as {
      status: ScreenerStatus;
      major_version: number;
      minor_version: number;
      updated_at: string;
    };

    revalidateScreenerPaths(screenerId, current.projectId);
    return {
      ok: true,
      screener: {
        status: row.status,
        majorVersion: row.major_version,
        minorVersion: row.minor_version,
        updatedAt: row.updated_at,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not mark screener as final.",
    };
  }
}

export async function setScreenerToDraft(
  screenerId: string,
): Promise<
  { ok: true; screener: ScreenerVersionSnapshot } | { ok: false; error: string }
> {
  try {
    assertUuid(screenerId, "screener id");
    const current = await getScreenerById(screenerId);
    if (current.status === "draft") {
      return { ok: false, error: "Screener is already a draft." };
    }

    const versionUpdate = versionFieldsAfterSetDraft();
    const updatedAt = new Date().toISOString();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("screeners")
      .update({
        status: versionUpdate.status,
        minor_version: versionUpdate.minorVersion,
        updated_at: updatedAt,
      })
      .eq("id", screenerId)
      .select("status, major_version, minor_version, updated_at")
      .single();

    if (error) return { ok: false, error: error.message };

    const row = data as {
      status: ScreenerStatus;
      major_version: number;
      minor_version: number;
      updated_at: string;
    };

    revalidateScreenerPaths(screenerId, current.projectId);
    return {
      ok: true,
      screener: {
        status: row.status,
        majorVersion: row.major_version,
        minorVersion: row.minor_version,
        updatedAt: row.updated_at,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not set screener to draft.",
    };
  }
}

function revalidateScreenerPaths(screenerId: string, projectId: string) {
  revalidatePath(`/workspace/screener-studio/${screenerId}`);
  revalidatePath("/screener-studio");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}`);
}
