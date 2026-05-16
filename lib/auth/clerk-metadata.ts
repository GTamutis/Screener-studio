import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type { ClerkAppMetadata } from "@/lib/auth/metadata";

export type { ClerkAppMetadata } from "@/lib/auth/metadata";

export async function syncClerkAppMetadata(
  clerkUserId: string,
  meta: ClerkAppMetadata,
): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        appStatus: meta.appStatus,
        appRole: meta.appRole,
      },
    });
  } catch {
    // Non-fatal — layout gate still uses Supabase
  }
}
