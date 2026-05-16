import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { isBootstrapAdminEmail, normalizeEmail } from "@/lib/auth/constants";
import { syncClerkAppMetadata } from "@/lib/auth/clerk-metadata";
import { mapAppUser, type AppUser, type AppUserRow } from "@/lib/auth/types";
import { formatUserDisplayName } from "@/lib/format-display-name";
import { createAdminClient } from "@/lib/supabase/admin";

async function linkClerkToRow(
  row: AppUserRow,
  clerkUserId: string,
  displayName: string,
): Promise<AppUser> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .update({
      clerk_user_id: clerkUserId,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .select(
      "id, clerk_user_id, email, display_name, role, status, created_at, approved_at",
    )
    .single();

  if (error || !data) {
    return mapAppUser(row);
  }
  const user = mapAppUser(data as AppUserRow);
  if (user.clerkUserId) {
    await syncClerkAppMetadata(user.clerkUserId, {
      appStatus: user.status,
      appRole: user.role,
    });
  }
  return user;
}

export async function ensureAppUserForClerkId(
  clerkUserId: string,
): Promise<AppUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== clerkUserId) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress?.trim() ?? "";
  if (!email) return null;

  const normalizedEmail = normalizeEmail(email);
  const displayName = formatUserDisplayName(clerkUser);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: byClerk } = await supabase
    .from("app_users")
    .select(
      "id, clerk_user_id, email, display_name, role, status, created_at, approved_at",
    )
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (byClerk) {
    const row = byClerk as AppUserRow;
    if (row.display_name !== displayName) {
      await supabase
        .from("app_users")
        .update({ display_name: displayName, updated_at: now })
        .eq("id", row.id);
    }
    const user = mapAppUser({ ...row, display_name: displayName });
    await syncClerkAppMetadata(clerkUserId, {
      appStatus: user.status,
      appRole: user.role,
    });
    return user;
  }

  const { data: byEmail } = await supabase
    .from("app_users")
    .select(
      "id, clerk_user_id, email, display_name, role, status, created_at, approved_at",
    )
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (byEmail) {
    return linkClerkToRow(byEmail as AppUserRow, clerkUserId, displayName);
  }

  const bootstrap = isBootstrapAdminEmail(email);
  const status = bootstrap ? "active" : "pending";
  const role = bootstrap ? "admin" : "member";

  const { data: created, error } = await supabase
    .from("app_users")
    .insert({
      clerk_user_id: clerkUserId,
      email: normalizedEmail,
      display_name: displayName,
      role,
      status,
      approved_at: bootstrap ? now : null,
    })
    .select(
      "id, clerk_user_id, email, display_name, role, status, created_at, approved_at",
    )
    .single();

  if (error || !created) return null;

  const user = mapAppUser(created as AppUserRow);
  await syncClerkAppMetadata(clerkUserId, {
    appStatus: user.status,
    appRole: user.role,
  });
  return user;
}
