import Link from "next/link";
import { LayoutGrid } from "lucide-react";

import { WorkspaceToolsGrid } from "@/components/workspace/workspace-tools-grid";
import { cn } from "@/lib/utils";

export function WorkspacePlacecards({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <LayoutGrid
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Tools
          </h2>
        </div>
        <Link
          href="/workspace/tools"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <WorkspaceToolsGrid />
    </section>
  );
}
