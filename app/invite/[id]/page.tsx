import type { Metadata } from "next";
import { InviteSessionClient } from "@/components/invitely/invite-session-client";

export const metadata: Metadata = {
  title: "Invitely invite",
};

export default function InvitePage({ params }: { params: { id: string } }) {
  return <InviteSessionClient sessionId={params.id} />;
}
