import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInviteSessionPublicMeta } from "@/app/actions/invitely";
import { InviteSessionClient } from "@/components/invitely/invite-session-client";

export const metadata: Metadata = {
  title: "Invitely invite",
};

export default async function InvitePage({ params }: { params: { id: string } }) {
  const publicMeta = await getInviteSessionPublicMeta(params.id);
  if ("error" in publicMeta) {
    notFound();
  }

  return (
    <InviteSessionClient sessionId={params.id} publicMeta={publicMeta} />
  );
}
