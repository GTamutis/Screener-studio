import "server-only";

import { auth } from "@clerk/nextjs/server";

import { ensureAppUserForClerkId } from "@/lib/auth/ensure-app-user";
import { mapAppUser, type AppUser, type AppUserRow } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAppUserByClerkId(
  clerkUserId: string,
): Promise<AppUser | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_users")
    .select(
      "id, clerk_user_id, email, display_name, role, status, created_at, approved_at",
    )
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (!data) return null;
  return mapAppUser(data as AppUserRow);
}

/** Active user for server actions; throws-style errors as strings. */
export async function getActiveAppUserForAction(): Promise<
  AppUser | { error: string }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in required." };

  let appUser = await getAppUserByClerkId(userId);
  if (!appUser) {
    appUser = await ensureAppUserForClerkId(userId);
  }
  if (!appUser) return { error: "Account not found." };
  if (appUser.status === "pending") {
    return { error: "Your account is awaiting approval." };
  }
  if (appUser.status === "disabled") {
    return { error: "Your account does not have access." };
  }
  if (!appUser.clerkUserId) {
    return { error: "Account setup incomplete. Sign in again." };
  }
  return appUser;
}

export async function getAdminAppUserForAction(): Promise<
  AppUser | { error: string }
> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return appUser;
  if (appUser.role !== "admin") return { error: "Admin access required." };
  return appUser;
}
