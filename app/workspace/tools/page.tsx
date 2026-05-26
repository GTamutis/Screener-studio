import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { WorkspaceToolsGrid } from "@/components/workspace/workspace-tools-grid";

export default function WorkspaceToolsPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      <header className="space-y-4">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Workspace home
        </Link>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
            Tools
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Day One Strategy tools for screeners, fieldwork, and project
            delivery — open any tool to get started.
          </p>
        </div>
      </header>

      <WorkspaceToolsGrid />
    </div>
  );
}
