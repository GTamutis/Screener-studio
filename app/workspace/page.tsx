import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Calculator,
  FolderKanban,
  Layers,
  Mail,
} from "lucide-react";

import { WorkspaceHeader } from "@/components/workspace-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { formatUserDisplayName } from "@/lib/format-display-name";

type ToolTile = {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bullets: readonly string[];
};

const TOOL_TILES: readonly ToolTile[] = [
  {
    href: "/screener-studio",
    label: "Studio",
    title: "Screener Studio",
    description:
      "Screening workflows, projects, and your question library — all in one place.",
    icon: Layers,
    bullets: ["Project dashboards", "Reusable question library", "Workflows"],
  },
  {
    href: "/invitely",
    label: "Invitely",
    title: "Invitely",
    description:
      "Password-protected attendee lists for multi-country studies — clients edit, you export.",
    icon: Mail,
    bullets: ["Live sessions", "Per-country breakdowns", "Client changelogs"],
  },
  {
    href: "/workspace/fair-market-values",
    label: "FMV",
    title: "Fair Market Values",
    description:
      "Client project hourly rates in local currency — auto-converted to USD, GBP, and EUR with history and proration.",
    icon: Calculator,
    bullets: ["FX on save", "Search & filters", "Minute proration"],
  },
] as const;

export default async function WorkspacePage() {
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);
  const firstName =
    user?.firstName?.trim() || displayName.split(" ")[0] || "friend";

  return (
    <>
      <WorkspaceHeader displayName={displayName} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <section className="space-y-3 animate-fade-in-up">
          <Badge variant="gradient" className="rounded-full px-3 py-1">
            Workspace
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            Welcome back,{" "}
            <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Organize initiatives in Projects, then open the tools you need.
            Switch anytime from the header.
          </p>
        </section>

        <section
          className="mt-10 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <Link
            href="/projects"
            className="block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <GlassCard
              interactive
              className="relative overflow-hidden rounded-3xl p-8 lg:p-10"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-gradient opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
              />
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-primary">
                    <FolderKanban className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[10px]">
                      Cross-tool layer
                    </Badge>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      Projects
                    </h2>
                    <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                      Client name, study code, project name, and markets — shared
                      across Screener Studio, Invitely, and everything you add
                      next.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
                  <span className="text-sm font-semibold text-gradient">
                    Open Projects
                  </span>
                  <ArrowRight className="h-4 w-4 text-foreground/70 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </GlassCard>
          </Link>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            Tools
          </h2>
          <ul className="grid items-stretch gap-6 lg:grid-cols-3">
            {TOOL_TILES.map((tile, index) => {
              const Icon = tile.icon;
              return (
                <li
                  key={tile.href}
                  className="flex h-full min-h-0 animate-fade-in-up"
                  style={{ animationDelay: `${160 + index * 90}ms` }}
                >
                  <Link
                    href={tile.href}
                    className="flex h-full w-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <GlassCard
                      interactive
                      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl p-8"
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-gradient opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                      />
                      <div className="relative flex min-h-0 flex-1 flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {tile.label}
                          </Badge>
                        </div>
                        <div className="mt-6 space-y-2">
                          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                            {tile.title}
                          </h3>
                          <p className="text-sm text-muted-foreground text-pretty">
                            {tile.description}
                          </p>
                        </div>
                        <ul className="mt-6 flex flex-wrap gap-2">
                          {tile.bullets.map((b) => (
                            <li
                              key={b}
                              className="rounded-full glass-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm font-semibold text-foreground">
                          <span className="text-gradient">Open</span>
                          <ArrowRight className="h-4 w-4 text-foreground/70 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
