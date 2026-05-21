import { currentUser } from "@clerk/nextjs/server";

import { listProjects } from "@/app/actions/projects";
import { WorkspaceMetricCards } from "@/components/workspace/workspace-metric-cards";
import { WorkspaceNewsFeed } from "@/components/workspace/workspace-news-feed";
import { WorkspacePlacecards } from "@/components/workspace/workspace-placecards";
import { WorkspaceProjectsTable } from "@/components/workspace/workspace-projects-table";
import { WorkspaceRightPanel } from "@/components/workspace/workspace-right-panel";
import {
  formatUkLongDate,
  greetingForHour,
} from "@/lib/format-relative-time";
import { formatUserDisplayName } from "@/lib/format-display-name";
import type { ProjectSummary } from "@/lib/projects/types";
import { getIndustryNews } from "@/lib/workspace/industry-news";
import { computeWorkspaceMetrics } from "@/lib/workspace/metrics";

export default async function WorkspacePage() {
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);
  const firstName =
    user?.firstName?.trim() || displayName.split(" ")[0] || "there";

  let projects: ProjectSummary[] = [];
  try {
    const result = await listProjects();
    if (!("error" in result)) {
      projects = result;
    }
  } catch {
    projects = [];
  }

  const metrics = computeWorkspaceMetrics(projects);
  const attentionCount = metrics.setup;

  const industryNews = await getIndustryNews();
  const projectClientNames = Array.from(
    new Set(
      projects.map((p) => p.clientName.trim()).filter((name) => name.length >= 3),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
        <div className="min-w-0 flex-1 space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
              {greetingForHour()}, {firstName}.
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatUkLongDate()}
              {attentionCount > 0
                ? ` — ${attentionCount} project${attentionCount === 1 ? "" : "s"} need your attention`
                : null}
            </p>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your dedicated Day One Strategy workspace for projects, screeners,
              and field tools — everything you need to move work forward in one
              place.
            </p>
          </header>

          <WorkspaceMetricCards metrics={metrics} />

          <WorkspacePlacecards />

          <WorkspaceProjectsTable projects={projects} />

          <WorkspaceNewsFeed
            items={industryNews.items}
            failedSources={industryNews.failedSources}
            sourceCounts={industryNews.sourceCounts}
            projectClientNames={projectClientNames}
          />
        </div>

        <WorkspaceRightPanel className="xl:sticky xl:top-8 xl:max-h-[calc(100dvh-4rem)] xl:overflow-y-auto" />
      </div>
    </div>
  );
}
