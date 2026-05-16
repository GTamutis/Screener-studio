import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { getInviteSessionForPm } from "@/app/actions/invitely";
import { InvitelySessionDetail } from "@/components/invitely/invitely-session-detail";
import { GlassCard } from "@/components/ui/glass/glass-card";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const detail = await getInviteSessionForPm(params.id);
    if ("error" in detail) return { title: "Session" };
    return { title: `${detail.session.projectName} · Invitely` };
  } catch {
    return { title: "Session" };
  }
}

function ErrorShell({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <GlassCard className="flex flex-col items-start gap-4 p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Link
        href="/invitely"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invitely
      </Link>
    </GlassCard>
  );
}

export default async function InvitelySessionPage({
  params,
}: {
  params: { id: string };
}) {
  let detail;
  try {
    detail = await getInviteSessionForPm(params.id);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not reach Invitely storage.";
    return <ErrorShell title="Could not load session" message={message} />;
  }

  if ("error" in detail) {
    if (detail.error === "Session not found.") {
      notFound();
    }
    return (
      <ErrorShell title="Could not load session" message={detail.error} />
    );
  }

  return <InvitelySessionDetail detail={detail} />;
}
