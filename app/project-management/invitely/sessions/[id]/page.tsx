import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInviteSessionForPm } from "@/app/actions/invitely";
import { InvitelySessionDetail } from "@/components/invitely/invitely-session-detail";

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
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm">
        <p className="font-semibold">Could not load session</p>
        <p className="mt-2">{message}</p>
        <Link
          href="/project-management/invitely"
          className="mt-4 inline-block text-sm font-semibold text-blue-950 underline"
        >
          Back to Invitely
        </Link>
      </div>
    );
  }

  if ("error" in detail) {
    if (detail.error === "Session not found.") {
      notFound();
    }
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-800 shadow-sm">
        <p>{detail.error}</p>
        <Link
          href="/project-management/invitely"
          className="mt-4 inline-block text-sm font-semibold text-blue-950 underline"
        >
          Back to Invitely
        </Link>
      </div>
    );
  }

  return <InvitelySessionDetail detail={detail} />;
}
