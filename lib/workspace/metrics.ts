import type { ProjectSummary } from "@/lib/projects/types";

const MS_DAY = 24 * 60 * 60 * 1000;

export type WorkspaceMetrics = {
  active: number;
  inField: number;
  setup: number;
  done30d: number;
};

/** Derive dashboard counts from project rows until project status exists in the DB. */
export function computeWorkspaceMetrics(
  projects: readonly ProjectSummary[],
): WorkspaceMetrics {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * MS_DAY;
  const thirtyDaysAgo = now - 30 * MS_DAY;

  let setup = 0;
  let done30d = 0;

  for (const p of projects) {
    const created = new Date(p.createdAt).getTime();
    if (Number.isNaN(created)) continue;
    if (created >= sevenDaysAgo) setup += 1;
    if (created < thirtyDaysAgo) done30d += 1;
  }

  return {
    active: projects.length,
    inField: 0,
    setup,
    done30d,
  };
}
