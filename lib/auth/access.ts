import type { AppUser } from "@/lib/auth/types";

export function isAdminUser(appUser: AppUser): boolean {
  return appUser.role === "admin";
}

/** When non-null, restrict queries to this Clerk user id. */
export function ownerClerkIdFilter(
  appUser: AppUser,
): string | null {
  if (isAdminUser(appUser)) return null;
  return appUser.clerkUserId;
}

export function canAccessOwnedResource(
  appUser: AppUser,
  resourceOwnerClerkId: string,
): boolean {
  if (isAdminUser(appUser)) return true;
  return appUser.clerkUserId === resourceOwnerClerkId;
}
