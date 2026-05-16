import { currentUser } from "@clerk/nextjs/server";

import { AppHeader } from "@/components/app-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { formatUserDisplayName } from "@/lib/format-display-name";
import { ensureAppUserForClerkId } from "@/lib/auth/ensure-app-user";
import { requireSignedInClerkId } from "@/lib/auth/require";
import { redirect } from "next/navigation";

export default async function PendingApprovalPage() {
  const clerkUserId = await requireSignedInClerkId();
  const appUser = await ensureAppUserForClerkId(clerkUserId);
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  if (appUser?.status === "active") redirect("/workspace");
  if (appUser?.status === "disabled") redirect("/access-denied");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        brandLabel="Day One Strategy"
        brandHref="/pending-approval"
        displayName={displayName}
        minimal
      />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <GlassCard className="space-y-4 rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Awaiting approval
          </h1>
          <p className="text-sm text-pretty text-muted-foreground">
            Your account is signed in, but an administrator has not approved
            access to the Day One Strategy workspace yet. You will receive
            access once approved — try signing in again later.
          </p>
          {user?.primaryEmailAddress?.emailAddress ? (
            <p className="font-mono text-xs text-muted-foreground">
              {user.primaryEmailAddress.emailAddress}
            </p>
          ) : null}
        </GlassCard>
      </main>
    </div>
  );
}
