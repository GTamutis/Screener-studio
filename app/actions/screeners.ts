"use server";

import { revalidatePath } from "next/cache";

import { getProject } from "@/app/actions/projects";
import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import { normalizeWhitespace } from "@/lib/invitely/validation";
import type {
  ScreenerStatus,
  ScreenerSummary,
  ScreenerWithProject,
} from "@/lib/screeners/types";
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
  created_at: string;
  updated_at: string;
};

function mapScreener(row: DbScreenerRow): ScreenerSummary {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
      .select("id, project_id, name, status, created_at, updated_at")
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
    .select("id, project_id, name, status, created_at, updated_at")
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
    .select("id, project_id, name, status, created_at, updated_at")
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

export async function touchScreenerSave(
  screenerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    assertUuid(screenerId, "screener id");
    await getScreenerById(screenerId);

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("screeners")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", screenerId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/workspace/screener-studio/${screenerId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save screener.",
    };
  }
}
