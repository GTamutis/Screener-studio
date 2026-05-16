import type { Metadata } from "next";
import { listInviteSessions } from "@/app/actions/invitely";
import { listProjects } from "@/app/actions/projects";
import { InvitelyDashboard } from "@/components/invitely/invitely-dashboard";

export const metadata: Metadata = {
  title: "Invitely",
};

export default async function InvitelyPage() {
  try {
    const sessions = await listInviteSessions();
    if ("error" in sessions) {
      return (
        <InvitelyDashboard
          initialSessions={[]}
          setupError={sessions.error}
          workspaceProjects={[]}
        />
      );
    }

    const projects = await listProjects();
    const workspaceProjects = "error" in projects ? [] : projects;

    return (
      <InvitelyDashboard
        initialSessions={sessions}
        setupError={null}
        workspaceProjects={workspaceProjects}
      />
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not reach Invitely storage.";
    return (
      <InvitelyDashboard
        initialSessions={[]}
        setupError={message}
        workspaceProjects={[]}
      />
    );
  }
}
