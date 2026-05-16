"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { DayOneMark } from "@/components/brand/day-one-mark";
import { UserMenu } from "@/components/ui/glass/user-menu";
import { cn } from "@/lib/utils";

export type AppHeaderNavItem = { href: string; label: string };

function linkActive(
  href: string,
  pathname: string,
  sectionRootHref: string | null,
) {
  if (!sectionRootHref) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (href === sectionRootHref) {
    return pathname === sectionRootHref || pathname === `${sectionRootHref}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({
  brandLabel,
  brandHref,
  sectionRootHref = null,
  navItems = [],
  displayName,
  isAdmin = false,
  pendingCount = 0,
  minimal = false,
}: {
  brandLabel: string;
  brandHref: string;
  sectionRootHref?: string | null;
  navItems?: readonly AppHeaderNavItem[];
  displayName: string;
  isAdmin?: boolean;
  pendingCount?: number;
  minimal?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href={brandHref}
            className="group inline-flex items-center gap-2 rounded-full px-1 py-0.5"
          >
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center text-foreground">
              <DayOneMark className="h-6 w-6" decorative />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {brandLabel}
            </span>
          </Link>

          {!minimal ? (
            <>
              <Link
                href="/workspace"
                title="Return to your workspace hub"
                aria-label="Back to workspace — projects and tools"
                className="hidden items-center gap-1.5 rounded-full glass-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-foreground/15 hover:text-foreground sm:inline-flex"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-80" />
                Workspace
              </Link>
              {navItems.length > 0 ? (
                <nav className="flex flex-wrap items-center gap-1">
                  {navItems.map(({ href, label }) => {
                    const active = linkActive(
                      href,
                      pathname,
                      sectionRootHref,
                    );
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {active ? (
                          <span
                            aria-hidden
                            className="absolute inset-0 -z-10 rounded-lg bg-brand-gradient-soft ring-1 ring-inset ring-primary/20"
                          />
                        ) : null}
                        <span className="relative">{label}</span>
                        {active ? (
                          <span
                            aria-hidden
                            className="absolute -bottom-[10px] left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-brand-gradient"
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {!minimal ? (
            <Link
              href="/workspace"
              title="Return to your workspace hub"
              aria-label="Back to workspace — projects and tools"
              className="inline-flex items-center gap-1.5 rounded-full glass-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-foreground/15 hover:text-foreground sm:hidden"
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-80" />
              Workspace
            </Link>
          ) : null}
          <UserMenu
            displayName={displayName}
            isAdmin={isAdmin}
            pendingCount={pendingCount}
            minimal={minimal}
          />
        </div>
      </div>
    </header>
  );
}
