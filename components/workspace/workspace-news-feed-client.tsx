"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Newspaper } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { augmentNewsItemsWithClients } from "@/lib/workspace/augment-news-items";
import type {
  IndustryNewsItem,
  IndustryNewsSourceCount,
} from "@/lib/workspace/industry-news-types";
import { cn } from "@/lib/utils";

const VISIBLE_ROWS = 4;
/** ~5.25rem per row (title + meta + optional tags). */
const COLLAPSED_MAX_HEIGHT = `${VISIBLE_ROWS * 5.25}rem`;

type SortOrder = "newest" | "oldest";
type SourceFilter = "all" | string;

function isSafeExternalNewsLink(href: string): boolean {
  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type WorkspaceNewsFeedClientProps = {
  className?: string;
  items: IndustryNewsItem[];
  failedSources?: string[];
  sourceCounts?: IndustryNewsSourceCount[];
  projectClientNames?: string[];
};

export function WorkspaceNewsFeedClient({
  className,
  items,
  failedSources = [],
  sourceCounts = [],
  projectClientNames = [],
}: WorkspaceNewsFeedClientProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);

  const safeItems = useMemo(
    () => items.filter((item) => isSafeExternalNewsLink(item.link)),
    [items],
  );

  const enrichedItems = useMemo(
    () => augmentNewsItemsWithClients(safeItems, projectClientNames),
    [safeItems, projectClientNames],
  );

  const sources = useMemo(() => {
    return Array.from(new Set(enrichedItems.map((i) => i.source))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [enrichedItems]);

  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    for (const item of enrichedItems) {
      for (const c of item.companies) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enrichedItems]);

  const filteredItems = useMemo(() => {
    let list = enrichedItems;

    if (sourceFilter !== "all") {
      list = list.filter((item) => item.source === sourceFilter);
    }

    if (companyFilter !== "all") {
      list = list.filter((item) => item.companies.includes(companyFilter));
    }

    list = [...list].sort((a, b) => {
      const diff =
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return list;
  }, [enrichedItems, sourceFilter, sortOrder, companyFilter]);

  const hasPartialFailure =
    failedSources.length > 0 && enrichedItems.length > 0;
  const isEmpty = enrichedItems.length === 0;
  const showExpandControl = filteredItems.length > VISIBLE_ROWS;

  const selectClass =
    "h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Newspaper className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Industry news
        </h2>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Headlines are unavailable right now. Please try again later.
          </p>
          {failedSources.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Could not reach: {failedSources.join(", ")}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {hasPartialFailure ? (
            <p className="text-xs text-muted-foreground">
              Some sources are temporarily unavailable ({failedSources.join(", ")}
              ).
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Source
              <select
                className={selectClass}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Filter by source"
              >
                <option value="all">All sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Sort
              <select
                className={selectClass}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                aria-label="Sort by published date"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Company
              <select
                className={selectClass}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Filter by company mentioned"
                disabled={allCompanies.length === 0}
              >
                <option value="all">All companies</option>
                {allCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </label>

            {filteredItems.length !== enrichedItems.length ? (
              <span className="text-xs text-muted-foreground">
                {filteredItems.length} of {enrichedItems.length}
              </span>
            ) : sourceCounts.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {sourceCounts
                  .map(({ source, count }) => `${source} (${count})`)
                  .join(" · ")}
              </span>
            ) : null}
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">
              No articles match these filters.
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-border bg-card",
                  !expanded && showExpandControl && "overflow-y-auto",
                )}
                style={
                  !expanded && showExpandControl
                    ? { maxHeight: COLLAPSED_MAX_HEIGHT }
                    : undefined
                }
              >
                <ul className="divide-y divide-border">
                  {filteredItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-3 px-5 py-4 transition hover:bg-secondary/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.source}
                            <span className="mx-1.5 text-border">·</span>
                            {formatRelativeTime(item.publishedAt)}
                          </p>
                          {item.companies.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.companies.slice(0, 4).map((company) => (
                                <Badge
                                  key={company}
                                  variant="secondary"
                                  className="px-2 py-0 text-[10px] font-medium"
                                >
                                  {company}
                                </Badge>
                              ))}
                              {item.companies.length > 4 ? (
                                <Badge
                                  variant="outline"
                                  className="px-2 py-0 text-[10px] font-medium"
                                >
                                  +{item.companies.length - 4}
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <ExternalLink
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                          aria-hidden
                        />
                        <span className="sr-only">(opens in new tab)</span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
                    : `Show all ${filteredItems.length} articles`}
                </Button>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}
