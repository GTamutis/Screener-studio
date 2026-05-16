"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { isAllowedInvitelyMarket } from "@/lib/invitely/countries";
import { normalizeWhitespace } from "@/lib/invitely/validation";
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
  created_at: string;
};

function mapSummary(row: DbProjectRow): ProjectSummary {
  return {
    id: row.id,
    clientName: row.client_name,
    projectNumber: row.project_number,
    projectName: row.project_name,
    markets: row.markets ?? [],
    createdAt: row.created_at,
  };
}

function mapProject(row: DbProjectRow): Project {
  return mapSummary(row);
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
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Sign in required." };

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
  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, clerk_user_id, client_name, project_number, project_name, markets, created_at",
    )
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return (data ?? []).map((row) => mapSummary(row as DbProjectRow));
}

export async function getProject(id: string): Promise<Project> {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in required.");
  assertUuid(id);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, clerk_user_id, client_name, project_number, project_name, markets, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Project not found.");
  const row = data as DbProjectRow;
  if (row.clerk_user_id !== userId) throw new Error("Project not found.");

  return mapProject(row);
}

export async function updateProject(input: {
  id: string;
  clientName: string;
  projectNumber: string;
  projectName: string;
  markets: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Sign in required." };
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
      .select("id")
      .eq("id", input.id)
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (findError) return { ok: false, error: findError.message };
    if (!existing) return { ok: false, error: "Project not found." };

    const { error } = await supabase
      .from("projects")
      .update({
        client_name: clientName,
        project_number: projectNumber,
        project_name: projectName,
        markets,
      })
      .eq("id", input.id)
      .eq("clerk_user_id", userId);

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

export async function deleteProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Sign in required." };
  assertUuid(id);

  const supabase = createAdminClient();
  const { data: existing, error: findError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (findError) return { ok: false, error: findError.message };
  if (!existing) return { ok: false, error: "Project not found." };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("clerk_user_id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/screener-studio/projects");
  return { ok: true };
}
