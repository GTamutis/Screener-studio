"use client";

import Link from "next/link";

import { DayOneMark } from "@/components/brand/day-one-mark";
import { UserMenu } from "@/components/ui/glass/user-menu";

export function WorkspaceHeader({ displayName }: { displayName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/workspace"
          className="group inline-flex items-center gap-2 rounded-full px-2 py-1"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center text-foreground">
            <DayOneMark className="h-6 w-6" decorative />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Workspace
          </span>
        </Link>
        <UserMenu displayName={displayName} />
      </div>
    </header>
  );
}
