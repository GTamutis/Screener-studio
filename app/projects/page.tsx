import { AlertTriangle, Globe } from "lucide-react";

import { listProjects } from "@/app/actions/projects";
import { ProjectsList } from "@/components/projects/projects-list";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/glass/empty-state";

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
        <ProjectsList projects={projects} />
      )}
    </div>
  );
}
