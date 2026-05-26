import Link from "next/link";
import { ArrowRight, FileText, Folder } from "lucide-react";

import { listProjects } from "@/app/actions/projects";
import { listRecentScreeners } from "@/app/actions/screeners";
import { RecentScreenersTable } from "@/components/screeners/recent-screeners-table";
import { NewScreenerStudioDialog } from "@/components/screeners/new-screener-studio-dialog";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import type { ProjectSummary } from "@/lib/projects/types";
import type { RecentScreenerSummary } from "@/lib/screeners/types";

const SHORTCUTS = [
  {
    href: "/screener-studio/projects",
    title: "Projects",
    description: "Active and archived screening projects.",
    icon: Folder,
  },
  {
    href: "/screener-studio/question-library",
    title: "Question library",
    description: "Reusable questions, tagged and searchable.",
    icon: FileText,
  },
] as const;

export default async function ScreenerStudioHomePage() {
  let projects: ProjectSummary[] = [];
  try {
    const result = await listProjects();
    if (!("error" in result)) projects = result;
  } catch {
    projects = [];
  }

  let screeners: RecentScreenerSummary[] = [];
  try {
    const result = await listRecentScreeners();
    if (!("error" in result)) screeners = result;
  } catch {
    screeners = [];
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Screener Studio"
        title="Dashboard"
        description="Overview and shortcuts for your screening work. Open a recent screener below or start a new one."
        actions={<NewScreenerStudioDialog projects={projects} />}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <GlassCard
                interactive
                className="flex h-full items-start gap-4 p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {s.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 self-center text-muted-foreground transition-transform group-hover:translate-x-1" />
              </GlassCard>
            </Link>
          );
        })}
      </section>

      <RecentScreenersTable screeners={screeners} />
    </div>
  );
}
