"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { UserMenu } from "@/components/ui/glass/user-menu";

export function WorkspaceHeader({ displayName }: { displayName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/workspace"
          className="group inline-flex items-center gap-2 rounded-full px-2 py-1"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-glow-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
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
