import Link from "next/link";

import {
  ProjectRowStatusBadge,
  projectStatusFromCreatedAt,
} from "@/components/workspace/project-row-status";
import type { ProjectSummary } from "@/lib/projects/types";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function WorkspaceProjectsTable({
  projects,
  className,
}: {
  projects: readonly ProjectSummary[];
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Recent projects
        </h2>
        <Link
          href="/projects"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Project
                </th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No projects yet.{" "}
                    <Link href="/projects" className="font-medium text-primary">
                      Create your first project
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                projects.slice(0, 8).map((project) => {
                  const status = projectStatusFromCreatedAt(project.createdAt);
                  return (
                    <tr
                      key={project.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="group block space-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="font-medium text-foreground group-hover:text-primary">
                            {project.projectName}
                          </span>
                          <span className="block font-mono text-[11px] text-muted-foreground">
                            {project.projectNumber}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-[10px] font-semibold text-foreground/80">
                            {clientInitials(project.clientName)}
                          </span>
                          {project.clientName}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <ProjectRowStatusBadge status={status} />
                      </td>
                      <td className="px-5 py-4 text-right text-muted-foreground">
                        {formatRelativeTime(project.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

