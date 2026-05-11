"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

export type SectionNavItem = { href: string; label: string };

function linkActive(
  href: string,
  pathname: string,
  sectionRootHref: string,
) {
  if (href === sectionRootHref) {
    return pathname === sectionRootHref || pathname === `${sectionRootHref}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SectionShell({
  brandLabel,
  brandHref,
  sectionRootHref,
  navItems,
  displayName,
  children,
}: {
  brandLabel: string;
  brandHref: string;
  sectionRootHref: string;
  navItems: readonly SectionNavItem[];
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
              <Link
                href={brandHref}
                className="text-base font-semibold tracking-tight text-slate-900"
              >
                {brandLabel}
              </Link>
              <Link
                href="/workspace"
                className="text-xs font-medium text-slate-500 hover:text-blue-950 sm:text-sm"
              >
                Switch app
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-1">
              {navItems.map(({ href, label }) => {
                const active = linkActive(href, pathname, sectionRootHref);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-100 text-blue-950"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="max-w-[200px] truncate text-sm text-slate-600 sm:max-w-xs">
              {displayName}
            </span>
            <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
