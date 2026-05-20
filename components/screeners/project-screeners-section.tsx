import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import { listScreenersForProject } from "@/app/actions/screeners";
import { NewScreenerDialog } from "@/components/screeners/new-screener-dialog";
import { ScreenerStatusBadge } from "@/components/screeners/screener-status-badge";
import { GlassCard } from "@/components/ui/glass/glass-card";

export async function ProjectScreenersSection({
  projectId,
}: {
  projectId: string;
}) {
  const result = await listScreenersForProject(projectId);
  const screeners = "error" in result ? [] : result;
  const loadError = "error" in result ? result.error : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Screeners
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Screener Studio questionnaires linked to this project.
          </p>
        </div>
        <NewScreenerDialog projectId={projectId} />
      </div>

      {loadError ? (
        <GlassCard className="border-amber-300/40 bg-amber-50/60 p-5 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
          Could not load screeners: {loadError}
        </GlassCard>
      ) : screeners.length === 0 ? (
        <GlassCard className="border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient-soft text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            No screeners yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first screener to start writing questions.
          </p>
        </GlassCard>
      ) : (
        <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
          {screeners.map((screener) => (
            <li key={screener.id}>
              <Link
                href={`/workspace/screener-studio/${screener.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient-soft text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {screener.name}
                  </p>
                </div>
                <ScreenerStatusBadge status={screener.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
