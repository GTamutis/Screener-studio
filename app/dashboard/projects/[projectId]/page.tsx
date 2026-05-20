import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Hash, UserRound } from "lucide-react";

import { getProject } from "@/app/actions/projects";
import { ProjectScreenersSection } from "@/components/screeners/project-screeners-section";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  try {
    const project = await getProject(params.projectId);
    return { title: `${project.projectName} · Project` };
  } catch {
    return { title: "Project" };
  }
}

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  let project;
  try {
    project = await getProject(params.projectId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <Link
          href="/dashboard/projects"
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
            <Badge variant="outline" className="font-mono text-[11px]">
              {project.projectNumber}
            </Badge>
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

      <ProjectScreenersSection projectId={project.id} />
    </div>
  );
}
