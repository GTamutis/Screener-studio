import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureAppUserForClerkId } from "@/lib/auth/ensure-app-user";
import type { AppUser } from "@/lib/auth/types";

export async function requireSignedInClerkId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function requireActiveAppUser(): Promise<AppUser> {
  const userId = await requireSignedInClerkId();
  const appUser = await ensureAppUserForClerkId(userId);
  if (!appUser) redirect("/sign-in");

  if (appUser.status === "pending") redirect("/pending-approval");
  if (appUser.status === "disabled") redirect("/access-denied");

  return appUser;
}

export async function requireAdminAppUser(): Promise<AppUser> {
  const appUser = await requireActiveAppUser();
  if (appUser.role !== "admin") redirect("/workspace");
  return appUser;
}

export function isAppAdmin(appUser: AppUser): boolean {
  return appUser.role === "admin";
}
