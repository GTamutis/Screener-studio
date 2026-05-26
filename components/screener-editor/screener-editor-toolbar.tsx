"use client";

import Link from "next/link";
import { ChevronRight, Download, FileText, Save } from "lucide-react";
import { toast } from "sonner";

import { ScreenerStatusBadge } from "@/components/screeners/screener-status-badge";
import { Button } from "@/components/ui/button";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export function ScreenerEditorToolbar({
  screener,
  activeSaveFormId,
}: {
  screener: ScreenerWithProject;
  activeSaveFormId?: string;
}) {
  const handleExport = () => {
    toast.message("Export coming soon");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-[hsl(var(--workspace-panel))] px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Link
          href="/screener-studio"
          className="flex shrink-0 items-center gap-1.5 font-medium text-muted-foreground transition hover:text-foreground"
        >
          <FileText className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Screener editor</span>
        </Link>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground/60"
          aria-hidden
        />
        <span className="truncate font-semibold text-foreground">
          {screener.name}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type={activeSaveFormId ? "submit" : "button"}
          form={activeSaveFormId}
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))]"
          disabled={!activeSaveFormId}
          title={
            activeSaveFormId
              ? "Save the active editor panel"
              : "Open project specs or a question to save changes"
          }
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <ScreenerStatusBadge status={screener.status} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))]"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
