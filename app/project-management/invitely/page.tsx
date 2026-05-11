import type { Metadata } from "next";
import { listInviteSessions } from "@/app/actions/invitely";
import { InvitelyDashboard } from "@/components/invitely/invitely-dashboard";

export const metadata: Metadata = {
  title: "Invitely",
};

export default async function InvitelyPage() {
  try {
    const sessions = await listInviteSessions();
    if ("error" in sessions) {
      return (
        <InvitelyDashboard initialSessions={[]} setupError={sessions.error} />
      );
    }
    return <InvitelyDashboard initialSessions={sessions} setupError={null} />;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not reach Invitely storage.";
    return <InvitelyDashboard initialSessions={[]} setupError={message} />;
  }
}
