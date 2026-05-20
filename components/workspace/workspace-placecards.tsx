import Link from "next/link";
import { ArrowRight, FileText, FolderKanban, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

const PLACES = [
  {
    href: "/projects",
    title: "Projects",
    description: "Client, study code, and markets shared across tools.",
    icon: FolderKanban,
    accent: "from-primary/15 to-primary/5",
  },
  {
    href: "/screener-studio",
    title: "Screener Studio",
    description: "Build and publish screening workflows.",
    icon: FileText,
    accent: "from-[hsl(var(--brand-from)/0.12)] to-transparent",
  },
  {
    href: "/invitely",
    title: "Invitely",
    description: "Attendee lists and multi-country field invites.",
    icon: Mail,
    accent: "from-[hsl(var(--dos-teal)/0.12)] to-transparent",
  },
] as const;

export function WorkspacePlacecards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {PLACES.map((place) => {
        const Icon = place.icon;
        return (
          <Link
            key={place.href}
            href={place.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 outline-none transition hover:border-primary/25 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
                place.accent,
              )}
            />
            <div className="relative flex flex-col gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {place.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {place.description}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Open
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

