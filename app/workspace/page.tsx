import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight, Briefcase, Layers } from "lucide-react";

import { WorkspaceHeader } from "@/components/workspace-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { formatUserDisplayName } from "@/lib/format-display-name";

type Tile = {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bullets: readonly string[];
};

const TILES: readonly Tile[] = [
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
    href: "/project-management",
    label: "PM tools",
    title: "Project management tools",
    description:
      "Planning, tracking, and delivery helpers for your initiatives.",
    icon: Briefcase,
    bullets: ["Invitely sessions", "Per-country breakdowns", "Changelogs"],
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
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome back,{" "}
            <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Pick an area to dive into. You can switch between apps anytime from
            the header.
          </p>
        </section>

        <ul className="mt-12 grid gap-6 lg:grid-cols-2">
          {TILES.map((tile, index) => {
            const Icon = tile.icon;
            return (
              <li
                key={tile.href}
                className="animate-fade-in-up"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <Link
                  href={tile.href}
                  className="block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <GlassCard
                    interactive
                    className="relative h-full overflow-hidden rounded-3xl p-8"
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-gradient opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {tile.label}
                      </Badge>
                    </div>
                    <div className="mt-6 space-y-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {tile.title}
                      </h2>
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
                    <div className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <span className="text-gradient">Open</span>
                      <ArrowRight className="h-4 w-4 text-foreground/70 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </GlassCard>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
