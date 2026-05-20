"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronRight, Download, FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { touchScreenerSave } from "@/app/actions/screeners";
import { ScreenerStatusBadge } from "@/components/screeners/screener-status-badge";
import { Button } from "@/components/ui/button";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export function ScreenerEditorToolbar({
  screener,
}: {
  screener: ScreenerWithProject;
}) {
  const [saving, startSave] = useTransition();

  const handleSave = () => {
    startSave(async () => {
      const res = await touchScreenerSave(screener.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Screener saved.");
    });
  };

  const handleExport = () => {
    toast.message("Export coming soon");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 dark:border-border dark:bg-card">
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
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-gray-200"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
        <ScreenerStatusBadge status={screener.status} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-gray-200"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
