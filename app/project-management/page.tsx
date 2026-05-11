import Link from "next/link";
import { ArrowRight, Mail, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Badge } from "@/components/ui/badge";

export default function ProjectManagementHomePage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Project management"
        title="Overview"
        description="A growing toolkit for running multi-country studies — start with Invitely, more coming soon."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <Link
          href="/project-management/invitely"
          className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <GlassCard interactive className="h-full p-7">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
                <Mail className="h-5 w-5" />
              </div>
              <Badge variant="success">Live</Badge>
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
              Invitely
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Collect password-protected attendee lists for multi-country
              studies — clients edit, you export.
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
              <span className="text-gradient">Open Invitely</span>
              <ArrowRight className="h-4 w-4 text-foreground/70 transition-transform group-hover:translate-x-1" />
            </div>
          </GlassCard>
        </Link>

        <GlassCard className="flex h-full flex-col p-7">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient-soft text-foreground ring-1 ring-inset ring-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <Badge variant="info">Coming soon</Badge>
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            More PM tools
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Drop new tools under{" "}
            <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[12px] font-mono text-foreground">
              app/project-management
            </code>
            . They&apos;ll automatically slot into the section nav.
          </p>
        </GlassCard>
      </section>
    </div>
  );
}
