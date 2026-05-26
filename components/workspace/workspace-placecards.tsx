import Link from "next/link";
import { ArrowRight, FileText, FolderKanban, Mail } from "lucide-react";

import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

const PLACES = [
  {
    href: "/projects",
    title: "Projects",
    description: "Client, study code, and markets shared across tools.",
    icon: FolderKanban,
    accent: "from-primary/12 to-transparent",
  },
  {
    href: "/screener-studio",
    title: "Screener Studio",
    description: "Build and publish screening workflows.",
    icon: FileText,
    accent: "from-[hsl(var(--brand-from)/0.1)] to-transparent",
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
            className={cn(
              workspaceCardClassName,
              "group relative overflow-hidden p-4 outline-none transition duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dos-teal)/0.35)] hover:shadow-glass-sm focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity group-hover:opacity-100",
                place.accent,
              )}
            />
            <div className="relative flex flex-col gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--dos-navy)/0.08)] text-[hsl(var(--dos-navy))] dark:bg-primary/15 dark:text-primary">
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
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--dos-blue))]">
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
