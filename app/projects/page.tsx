import Link from "next/link";
import { AlertTriangle, Globe } from "lucide-react";

import { listProjects } from "@/app/actions/projects";
import type { ProjectSummary } from "@/lib/projects/types";

import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/glass/empty-state";

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <GlassCard interactive className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {project.projectName}
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {project.clientName}
              </span>
              <span className="mx-1.5 text-border">·</span>
              <span className="font-mono text-xs text-muted-foreground">
                {project.projectNumber}
              </span>
            </p>
          </div>
          <Badge variant="gradient" className="shrink-0">
            <Globe className="mr-1 h-3 w-3" />
            {project.markets.length}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(project.markets ?? []).map((m) => (
            <span
              key={m}
              className="rounded-full bg-brand-gradient-soft px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-inset ring-primary/15"
            >
              {m}
            </span>
          ))}
        </div>
      </GlassCard>
    </Link>
  );
}

export default async function ProjectsPage() {
  let result: Awaited<ReturnType<typeof listProjects>>;
  try {
    result = await listProjects();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load projects storage.";
    result = { error: message };
  }

  const setupError = "error" in result ? result.error : null;
  const projects = "error" in result ? [] : result;

  if (setupError) {
    return (
      <div className="space-y-10">
        <PageHeader
          eyebrow="Workspace"
          title="Projects"
          description="Cross-tool project layer for every initiative in your workspace."
        />
        <GlassCard className="flex items-start gap-4 border-amber-300/40 bg-amber-50/60 p-6 text-amber-950 ring-1 ring-inset ring-amber-200/40 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Projects need configuration</p>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/80">
              {setupError}
            </p>
            <p className="text-xs text-amber-900/70 dark:text-amber-100/60">
              Add Supabase environment variables and run{" "}
              <code className="rounded-md bg-amber-100/60 px-1.5 py-0.5 font-mono text-[11px] dark:bg-amber-400/10">
                supabase/migrations/002_projects.sql
              </code>{" "}
              against your database.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="One place for client, study, and market context — link tool outputs here as features roll out."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </Badge>
            <NewProjectDialog />
          </div>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No projects yet"
          description='Create a project with the "New Project" button. You will connect Screener Studio, Invitely, and future tools in upcoming updates.'
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
