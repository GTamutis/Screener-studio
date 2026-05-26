import Link from "next/link";
import { Copy, UserPlus } from "lucide-react";

import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

type FieldHealthItem = {
  title: string;
  meta: string;
  percent: number;
  pace: "good" | "warn";
};

const PLACEHOLDER_FIELD: FieldHealthItem[] = [
  {
    title: "Automotive segmentation",
    meta: "640 / 1,000 — closes 28 May",
    percent: 64,
    pace: "good",
  },
  {
    title: "FinGroup usage survey",
    meta: "220 / 1,000 — closes 22 May",
    percent: 22,
    pace: "warn",
  },
];

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
            href="/projects"
            className="flex h-10 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
            Import from template
          </Link>
          <Link
            href="/workspace/users"
            className="flex h-10 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary"
          >
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            Invite a team member
          </Link>
        </div>
      </PanelCard>

      <PanelCard title="Field health">
        <ul className="space-y-4">
          {PLACEHOLDER_FIELD.map((item) => (
            <li key={item.title} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{item.meta}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary",
                    item.pace === "warn" && "bg-[hsl(var(--status-warning))]",
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{item.percent}% complete</span>
                <span
                  className={cn(
                    item.pace === "good"
                      ? "text-[hsl(var(--status-success))]"
                      : "text-[hsl(var(--status-warning))]",
                  )}
                >
                  {item.pace === "good" ? "On pace" : "Behind"}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Live quota tracking will connect to field tools soon.
        </p>
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
