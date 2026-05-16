import { currentUser } from "@clerk/nextjs/server";

import { AppHeader } from "@/components/app-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { formatUserDisplayName } from "@/lib/format-display-name";
import { ensureAppUserForClerkId } from "@/lib/auth/ensure-app-user";
import { requireSignedInClerkId } from "@/lib/auth/require";
import { redirect } from "next/navigation";

export default async function AccessDeniedPage() {
  const clerkUserId = await requireSignedInClerkId();
  const appUser = await ensureAppUserForClerkId(clerkUserId);
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  if (appUser?.status === "active") redirect("/workspace");
  if (appUser?.status === "pending") redirect("/pending-approval");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        brandLabel="Day One Strategy"
        brandHref="/access-denied"
        displayName={displayName}
        minimal
      />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <GlassCard className="space-y-4 rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Access not available
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            This account is not authorized to use the workspace. Contact your
            administrator if you believe this is a mistake.
          </p>
        </GlassCard>
      </main>
    </div>
  );
}

