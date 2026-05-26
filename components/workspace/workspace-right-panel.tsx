import Link from "next/link";
import { UserPlus } from "lucide-react";

import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

export function WorkspaceRightPanel({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-6 lg:w-[280px]",
        className,
      )}
    >
      <PanelCard title="Quick actions">
        <div className="flex flex-col gap-2">
          <NewProjectDialog />
          <Link
            href="/workspace/users"
            className="flex h-10 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary"
          >
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            Invite a team member
          </Link>
        </div>
      </PanelCard>
    </aside>
  );
}

function PanelCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(workspaceCardClassName, "p-5")}>
      <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
