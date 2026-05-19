import "server-only";

import type { AppUserRole } from "@/lib/auth/constants";
import { createAdminClient } from "@/lib/supabase/admin";

/** Keeps `profiles.is_admin` aligned with `app_users.role` for question_library RLS. */
export async function syncLibraryProfileForClerkUser(
  clerkUserId: string,
  options: { isAdmin: boolean; name?: string | null },
): Promise<void> {
  if (!clerkUserId) return;

  const supabase = createAdminClient();
  const row: { id: string; is_admin: boolean; name?: string | null } = {
    id: clerkUserId,
    is_admin: options.isAdmin,
  };
  if (options.name != null) {
    row.name = options.name;
  }

  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    console.error("[syncLibraryProfile]", error.message);
  }
}

export async function syncLibraryProfileFromAppUser(
  clerkUserId: string | null,
  role: AppUserRole,
  name?: string | null,
): Promise<void> {
  if (!clerkUserId) return;
  await syncLibraryProfileForClerkUser(clerkUserId, {
    isAdmin: role === "admin",
    name,
  });
}

export async function deleteLibraryProfile(clerkUserId: string): Promise<void> {
  if (!clerkUserId) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").delete().eq("id", clerkUserId);

  if (error) {
    console.error("[deleteLibraryProfile]", error.message);
  }
}
