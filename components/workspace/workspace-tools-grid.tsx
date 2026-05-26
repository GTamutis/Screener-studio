import Link from "next/link";
import { ArrowRight, Calculator, FileText, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  WORKSPACE_TOOLS,
  type WorkspaceTool,
  type WorkspaceToolId,
} from "@/lib/workspace/tools";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

const TOOL_ICONS: Record<WorkspaceToolId, LucideIcon> = {
  "screener-studio": FileText,
  invitely: Send,
  fmv: Calculator,
};

export function WorkspaceToolsGrid({
  tools = WORKSPACE_TOOLS,
  className,
}: {
  tools?: readonly WorkspaceTool[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {tools.map((tool) => (
        <WorkspaceToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function WorkspaceToolCard({ tool }: { tool: WorkspaceTool }) {
  const Icon = TOOL_ICONS[tool.id];

  return (
    <Link
      href={tool.href}
      className={cn(
        workspaceCardClassName,
        "group relative overflow-hidden p-4 outline-none transition duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--dos-teal)/0.35)] hover:shadow-glass-sm focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity group-hover:opacity-100",
          tool.accent,
        )}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--dos-navy)/0.08)] text-[hsl(var(--dos-navy))] dark:bg-primary/15 dark:text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{tool.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--dos-blue))]">
          Open
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
