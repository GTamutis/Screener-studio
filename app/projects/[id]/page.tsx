import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Hash, UserRound } from "lucide-react";

import { getProject } from "@/app/actions/projects";
import type { ProjectSummary } from "@/lib/projects/types";

import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const project = await getProject(params.id);
    return { title: `${project.projectName} · Projects` };
  } catch {
    return { title: "Project" };
  }
}

function editProjectFormKey(project: ProjectSummary) {
  return [
    project.id,
    project.clientName,
    project.projectNumber,
    project.projectName,
    project.markets.join("\u0001"),
  ].join("\u0002");
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let project;
  try {
    project = await getProject(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All projects
        </Link>
        <PageHeader
          eyebrow={project.clientName}
          title={project.projectName}
          description={`Project ${project.projectNumber} · ${project.markets.length} market${project.markets.length === 1 ? "" : "s"}.`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[11px]">
                {project.projectNumber}
              </Badge>
              <DeleteProjectButton projectId={project.id} />
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Client
              </p>
              <p className="text-sm font-semibold text-foreground">
                {project.clientName}
              </p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Project number
              </p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {project.projectNumber}
              </p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-3 p-5 sm:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Markets
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {project.markets.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-brand-gradient-soft px-2 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-inset ring-primary/15"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <section className="space-y-4">
        <EditProjectForm
          key={editProjectFormKey(project)}
          project={project}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Tools
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Tool outputs will appear here as you link records to this project.
          </p>
        </div>
        <GlassCard className="border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tool integrations yet. Invitely sessions and other workspace data
            will surface here once linked to this project.
          </p>
        </GlassCard>
      </section>
    </div>
  );
}
