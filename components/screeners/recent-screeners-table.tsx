import Link from "next/link";
import { FileText } from "lucide-react";

import { ScreenerStatusBadge } from "@/components/screeners/screener-status-badge";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { RecentScreenerSummary } from "@/lib/screeners/types";
import { cn } from "@/lib/utils";

const EMPTY_COL_SPAN = 7;

export function RecentScreenersTable({
  screeners,
  className,
}: {
  screeners: readonly RecentScreenerSummary[];
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Recent screeners
        </h2>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="table-head-row">
                <th className="table-head-cell px-5 py-3">Screener</th>
                <th className="table-head-cell px-4 py-3">Client</th>
                <th className="table-head-cell px-4 py-3">Project ref</th>
                <th className="table-head-cell px-4 py-3">Project name</th>
                <th className="table-head-cell px-4 py-3">Status</th>
                <th className="table-head-cell px-4 py-3">Owner</th>
                <th className="table-head-cell px-5 py-3 text-right">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {screeners.length === 0 ? (
                <tr>
                  <td
                    colSpan={EMPTY_COL_SPAN}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No screeners yet. Use{" "}
                    <span className="font-medium text-foreground">
                      New Screener
                    </span>{" "}
                    above to create your first one.
                  </td>
                </tr>
              ) : (
                screeners.map((screener) => (
                  <tr
                    key={screener.id}
                    className="group border-b border-border last:border-0 transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/workspace/screener-studio/${screener.id}`}
                        className="font-medium text-foreground outline-none transition group-hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {screener.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {screener.clientName}
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                      {screener.projectNumber}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {screener.projectName}
                    </td>
                    <td className="px-4 py-4">
                      <ScreenerStatusBadge status={screener.status} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {screener.ownerDisplayName}
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground">
                      {formatRelativeTime(screener.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </section>
  );
}
