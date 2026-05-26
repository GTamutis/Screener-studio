"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, FolderKanban, Search } from "lucide-react";

import {
  ProjectRowStatusBadge,
  projectStatusFromCreatedAt,
  type ProjectRowStatus,
} from "@/components/workspace/project-row-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { workspaceCardClassName } from "@/lib/form-classes";
import type { ProjectSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

const VISIBLE_ROWS = 8;

type SortOrder = "newest" | "oldest";
type StatusFilter = "all" | ProjectRowStatus;

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function projectSearchHaystack(project: ProjectSummary): string {
  return [
    project.projectName,
    project.projectNumber,
    project.clientName,
    project.ownerDisplayName,
    ...project.markets,
  ]
    .join(" ")
    .toLowerCase();
}

function MarketsCell({ markets }: { markets: readonly string[] }) {
  if (markets.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = markets.slice(0, 3);
  const extra = markets.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((m) => (
        <Badge
          key={m}
          variant="secondary"
          className="px-2 py-0 text-[10px] font-medium"
        >
          {m}
        </Badge>
      ))}
      {extra > 0 ? (
        <Badge variant="outline" className="px-2 py-0 text-[10px] font-medium">
          +{extra}
        </Badge>
      ) : null}
    </div>
  );
}

export function ProjectsList({
  projects,
  className,
}: {
  projects: readonly ProjectSummary[];
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [expanded, setExpanded] = useState(false);

  const clients = useMemo(
    () =>
      Array.from(new Set(projects.map((p) => p.clientName))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [projects],
  );

  const markets = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      for (const m of p.markets) set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      map.set(p.ownerClerkUserId, p.ownerDisplayName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (q && !projectSearchHaystack(p).includes(q)) return false;
      if (clientFilter !== "all" && p.clientName !== clientFilter) return false;
      if (marketFilter !== "all" && !p.markets.includes(marketFilter)) {
        return false;
      }
      if (ownerFilter !== "all" && p.ownerClerkUserId !== ownerFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        const status = projectStatusFromCreatedAt(p.createdAt);
        if (status !== statusFilter) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return list;
  }, [
    projects,
    query,
    clientFilter,
    marketFilter,
    ownerFilter,
    statusFilter,
    sortOrder,
  ]);

  const showExpandControl = filtered.length > VISIBLE_ROWS;
  const visibleRows = expanded ? filtered : filtered.slice(0, VISIBLE_ROWS);

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <FolderKanban className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
          All projects
        </h2>
        {filtered.length !== projects.length ? (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {projects.length}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project, client, country, or PM…"
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Client
          <FilterSelect
            size="sm"
            value={clientFilter}
            onValueChange={setClientFilter}
            aria-label="Filter by client"
            options={[
              { value: "all", label: "All clients" },
              ...clients.map((c) => ({ value: c, label: c })),
            ]}
          />
        </label>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Country
          <FilterSelect
            size="sm"
            value={marketFilter}
            onValueChange={setMarketFilter}
            aria-label="Filter by country"
            disabled={markets.length === 0}
            options={[
              { value: "all", label: "All countries" },
              ...markets.map((m) => ({ value: m, label: m })),
            ]}
          />
        </label>

        {owners.length > 1 ? (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Project manager
            <FilterSelect
              size="sm"
              value={ownerFilter}
              onValueChange={setOwnerFilter}
              aria-label="Filter by project manager"
              options={[
                { value: "all", label: "All PMs" },
                ...owners.map((o) => ({ value: o.id, label: o.name })),
              ]}
            />
          </label>
        ) : null}

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Status
          <FilterSelect
            size="sm"
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            aria-label="Filter by status"
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "In field" },
              { value: "setup", label: "Setup" },
              { value: "draft", label: "Draft" },
              { value: "done", label: "Done" },
            ]}
          />
        </label>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Sort
          <FilterSelect
            size="sm"
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as SortOrder)}
            aria-label="Sort projects"
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div
          className={cn(
            workspaceCardClassName,
            "px-5 py-10 text-center text-sm text-muted-foreground",
          )}
        >
          {projects.length === 0
            ? "No projects yet."
            : "No projects match your search or filters."}
        </div>
      ) : (
        <div className="space-y-2">
          <div className={cn(workspaceCardClassName, "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell px-5 py-3">Project</th>
                    <th className="table-head-cell px-4 py-3">Client</th>
                    <th className="table-head-cell min-w-[10rem] px-4 py-3">
                      Countries
                    </th>
                    <th className="table-head-cell min-w-[8rem] px-4 py-3">
                      Project manager
                    </th>
                    <th className="table-head-cell px-4 py-3">Status</th>
                    <th className="table-head-cell px-5 py-3 text-right">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((project) => {
                    const status = projectStatusFromCreatedAt(project.createdAt);
                    return (
                      <tr
                        key={project.id}
                        className="group border-b border-border last:border-0 transition-colors hover:border-l-2 hover:border-l-[hsl(var(--dos-teal)/0.5)] hover:bg-[hsl(var(--dos-teal)/0.04)]"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/projects/${project.id}`}
                            className="group/link block space-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="font-medium text-foreground group-hover/link:text-primary">
                              {project.projectName}
                            </span>
                            <span className="block font-mono text-[11px] text-muted-foreground">
                              {project.projectNumber}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5 text-muted-foreground">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-semibold text-foreground/80">
                              {clientInitials(project.clientName)}
                            </span>
                            <span className="min-w-0 truncate">
                              {project.clientName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <MarketsCell markets={project.markets} />
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {project.ownerDisplayName}
                        </td>
                        <td className="px-4 py-4">
                          <ProjectRowStatusBadge status={status} />
                        </td>
                        <td className="px-5 py-4 text-right text-muted-foreground">
                          {formatRelativeTime(project.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {showExpandControl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs text-muted-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition",
                  expanded && "rotate-180",
                )}
              />
              {expanded
                ? "Show less"
                : `Show all ${filtered.length} projects`}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
