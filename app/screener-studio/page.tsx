import Link from "next/link";
import { ArrowRight, FileText, Folder, LayoutDashboard } from "lucide-react";

import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";

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

export default function ScreenerStudioHomePage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Screener Studio"
        title="Dashboard"
        description="Overview and shortcuts for your screening work. Quick links below — full dashboards are on the way."
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

      <section>
        <GlassCard className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft text-foreground ring-1 ring-inset ring-primary/20">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="info" className="mb-2">
                Coming soon
              </Badge>
              <h2 className="text-lg font-semibold tracking-tight">
                Activity overview
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Live metrics across projects, response volumes, and progress
                indicators will land here.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
