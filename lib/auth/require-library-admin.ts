import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import {
  requireActiveAppUser,
  requireSignedInClerkId,
} from "@/lib/auth/require";
import { syncLibraryProfileFromAppUser } from "@/lib/auth/sync-library-profile";
import type { AppUser } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type LibraryAdminContext = {
  clerkUserId: string;
  name: string | null;
};

function isWorkspaceAdmin(appUser: AppUser): boolean {
  return appUser.role === "admin" && appUser.status === "active";
}

async function resolveLibraryAdmin(
  clerkUserId: string,
  appUser: AppUser,
): Promise<LibraryAdminContext | null> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, name")
    .eq("id", clerkUserId)
    .maybeSingle();

  if (profile?.is_admin) {
    return { clerkUserId, name: profile.name ?? appUser.displayName };
  }

  if (isWorkspaceAdmin(appUser)) {
    await syncLibraryProfileFromAppUser(
      clerkUserId,
      appUser.role,
      appUser.displayName,
    );
    return { clerkUserId, name: profile?.name ?? appUser.displayName };
  }

  return null;
}

/** UI gate: workspace admin or `profiles.is_admin`. */
export async function canManageQuestionLibrary(): Promise<boolean> {
  try {
    const appUser = await requireActiveAppUser();
    const clerkUserId = await requireSignedInClerkId();
    const ctx = await resolveLibraryAdmin(clerkUserId, appUser);
    return ctx !== null;
  } catch {
    return false;
  }
}

/** For server actions — returns an error instead of redirecting. */
export async function getLibraryAdminForAction(): Promise<
  LibraryAdminContext | { error: string }
> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return { error: appUser.error };

  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };

  const ctx = await resolveLibraryAdmin(userId, appUser);
  if (!ctx) return { error: "Library admin access required." };

  return ctx;
}

/** Gate admin question-library routes (`profiles.is_admin` or workspace admin). */
export async function requireLibraryAdmin(): Promise<LibraryAdminContext> {
  const appUser = await requireActiveAppUser();
  const clerkUserId = await requireSignedInClerkId();

  const ctx = await resolveLibraryAdmin(clerkUserId, appUser);
  if (!ctx) redirect("/workspace");

  return ctx;
}

export async function isLibraryAdmin(clerkUserId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", clerkUserId)
    .maybeSingle();

  return Boolean(data?.is_admin);
}
