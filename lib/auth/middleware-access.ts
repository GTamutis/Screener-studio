import { createClient } from "@supabase/supabase-js";

import type { AppUserRole, AppUserStatus } from "@/lib/auth/constants";
import type { ClerkAppMetadata } from "@/lib/auth/metadata";

type AppAccessRow = {
  role: unknown;
  status: unknown;
};

function isAppRole(role: unknown): role is AppUserRole {
  return role === "admin" || role === "member";
}

function isAppStatus(status: unknown): status is AppUserStatus {
  return status === "pending" || status === "active" || status === "disabled";
}

function createMiddlewareSupabaseClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getMiddlewareAppAccess(
  clerkUserId: string,
  fallback: ClerkAppMetadata | null,
): Promise<ClerkAppMetadata | null> {
  const supabase = createMiddlewareSupabaseClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("app_users")
      .select("role, status")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle<AppAccessRow>();

    if (error || !data || !isAppRole(data.role) || !isAppStatus(data.status)) {
      return fallback;
    }

    return {
      appRole: data.role,
      appStatus: data.status,
    };
  } catch {
    return fallback;
  }
}
