import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { requireActiveAppUser } from "@/lib/auth/require";
import { formatUserDisplayName } from "@/lib/format-display-name";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthenticatedShellProps = {
  displayName: string;
  isAdmin: boolean;
  pendingCount: number;
};

export async function getAuthenticatedShellProps(): Promise<AuthenticatedShellProps> {
  const appUser = await requireActiveAppUser();
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  let pendingCount = 0;
  if (appUser.role === "admin") {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("app_users")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return {
    displayName,
    isAdmin: appUser.role === "admin",
    pendingCount,
  };
}
