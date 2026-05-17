"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { normalizeEmail } from "@/lib/auth/constants";
import { syncClerkAppMetadata } from "@/lib/auth/clerk-metadata";
import { mapAppUser, type AppUser, type AppUserRow } from "@/lib/auth/types";
import { getAdminAppUserForAction } from "@/lib/auth/get-app-user";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

function mapRow(row: AppUserRow): AppUser {
  return mapAppUser(row);
}

export type AppUserListItem = AppUser & {
  hasSignedIn: boolean;
};

export async function listAppUsers(): Promise<
  AppUserListItem[] | { error: string }
> {
  const admin = await getAdminAppUserForAction();
  if ("error" in admin) return { error: admin.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_users")
    .select(
      "id, clerk_user_id, email, display_name, role, status, created_at, approved_at",
    )
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  return (data ?? []).map((row) => {
    const user = mapRow(row as AppUserRow);
    return { ...user, hasSignedIn: Boolean(user.clerkUserId) };
  });
}

export async function approveAppUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminAppUserForAction();
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: row, error: findError } = await supabase
    .from("app_users")
    .select("id, clerk_user_id, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (findError) return { ok: false, error: findError.message };
  if (!row) return { ok: false, error: "User not found." };
  if (row.status !== "pending") {
    return { ok: false, error: "Only pending users can be approved." };
  }

  const { error } = await supabase
    .from("app_users")
    .update({
      status: "active",
      approved_at: now,
      approved_by_clerk_id: admin.clerkUserId,
      updated_at: now,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  if (row.clerk_user_id) {
    await syncClerkAppMetadata(row.clerk_user_id, {
      appStatus: "active",
      appRole: row.role as "admin" | "member",
    });
  }

  revalidatePath("/workspace/users");
  return { ok: true };
}

export async function inviteAppUser(input: {
  email: string;
  role: "admin" | "member";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminAppUserForAction();
  if ("error" in admin) return { ok: false, error: admin.error };

  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("app_users")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing?.status === "disabled") {
    const { error: reviveError } = await supabase
      .from("app_users")
      .update({
        status: "active",
        role: input.role,
        invited_by_clerk_id: admin.clerkUserId,
        approved_at: now,
        approved_by_clerk_id: admin.clerkUserId,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (reviveError) return { ok: false, error: reviveError.message };
  } else if (!existing) {
    const { error: insertError } = await supabase.from("app_users").insert({
      email,
      role: input.role,
      status: "active",
      invited_by_clerk_id: admin.clerkUserId,
      approved_at: now,
      approved_by_clerk_id: admin.clerkUserId,
    });

    if (insertError) return { ok: false, error: insertError.message };
  } else if (existing.status === "pending") {
    const { error: promoteError } = await supabase
      .from("app_users")
      .update({
        status: "active",
        role: input.role,
        approved_at: now,
        approved_by_clerk_id: admin.clerkUserId,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (promoteError) return { ok: false, error: promoteError.message };
  } else {
    return { ok: false, error: "This email already has an active account." };
  }

  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${appOrigin()}/workspace`,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not send Clerk invitation.";
    return { ok: false, error: message };
  }

  revalidatePath("/workspace/users");
  return { ok: true };
}

export async function removeAppUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminAppUserForAction();
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createAdminClient();
  const { data: row, error: findError } = await supabase
    .from("app_users")
    .select("id, clerk_user_id, email")
    .eq("id", userId)
    .maybeSingle();

  if (findError) return { ok: false, error: findError.message };
  if (!row) return { ok: false, error: "User not found." };
  if (row.clerk_user_id && row.clerk_user_id === admin.clerkUserId) {
    return { ok: false, error: "You cannot remove your own account." };
  }

  if (row.clerk_user_id) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(row.clerk_user_id);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not delete Clerk user.";
      return { ok: false, error: message };
    }
  } else {
    try {
      const client = await clerkClient();
      const invitations = await client.invitations.getInvitationList({
        status: "pending",
      });
      const match = invitations.data.find(
        (inv) =>
          inv.emailAddress &&
          normalizeEmail(inv.emailAddress) === normalizeEmail(row.email),
      );
      if (match?.id) {
        await client.invitations.revokeInvitation(match.id);
      }
    } catch {
      // Best-effort revoke
    }
  }

  const { error: deleteError } = await supabase
    .from("app_users")
    .delete()
    .eq("id", userId);

  if (deleteError) return { ok: false, error: deleteError.message };

  revalidatePath("/workspace/users");
  return { ok: true };
}

export async function countPendingUsers(): Promise<number> {
  const admin = await getAdminAppUserForAction();
  if ("error" in admin) return 0;

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}
