import type { AppUserRole, AppUserStatus } from "@/lib/auth/constants";

export type ClerkAppMetadata = {
  appStatus: AppUserStatus;
  appRole: AppUserRole;
};

export function readClerkAppMetadata(
  publicMetadata: unknown,
): ClerkAppMetadata | null {
  if (!publicMetadata || typeof publicMetadata !== "object") return null;
  const m = publicMetadata as Record<string, unknown>;
  const appStatus = m.appStatus;
  const appRole = m.appRole;
  if (
    (appStatus === "pending" ||
      appStatus === "active" ||
      appStatus === "disabled") &&
    (appRole === "admin" || appRole === "member")
  ) {
    return { appStatus, appRole };
  }
  return null;
}
