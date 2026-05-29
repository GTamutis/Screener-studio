"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Save,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import {
  touchScreenerSave,
  type ScreenerVersionSnapshot,
} from "@/app/actions/screeners";
import { ScreenerEditorStatusMenu } from "@/components/screener-editor/screener-editor-status-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export function ScreenerEditorToolbar({
  screener,
  onScreenerVersionChange,
  qualityReviewLoading,
  onRunQualityReview,
  onStopQualityReview,
}: {
  screener: ScreenerWithProject;
  onScreenerVersionChange: (snapshot: ScreenerVersionSnapshot) => void;
  qualityReviewLoading?: boolean;
  onRunQualityReview?: () => void;
  onStopQualityReview?: () => void;
}) {
  const [saving, startSave] = useTransition();
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleSave = () => {
    startSave(async () => {
      const res = await touchScreenerSave(screener.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onScreenerVersionChange(res.screener);
      toast.success("Screener saved.");
    });
  };

  const downloadExport = async (
    endpoint: "/api/export/word" | "/api/export/excel",
    fallbackFilename: string,
    successMessage: string,
  ) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screenerId: screener.id }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast.error(payload?.error ?? "Export failed. Please try again.");
      return;
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="([^"]+)"/i);
    const filename = filenameMatch?.[1] ?? fallbackFilename;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    toast.success(successMessage);
  };

  const handleExportWord = async () => {
    setExportingWord(true);
    try {
      await downloadExport(
        "/api/export/word",
        `${screener.name.replace(/[^\w\s-]+/g, "").trim() || "screener"}-export.docx`,
        "Word document downloaded.",
      );
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingWord(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await downloadExport(
        "/api/export/excel",
        `${screener.name.replace(/[^\w\s-]+/g, "").trim() || "screener"}-responses.xlsx`,
        "Excel spreadsheet downloaded.",
      );
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingExcel(false);
    }
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
        {qualityReviewLoading && onStopQualityReview ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-destructive/40 bg-[hsl(var(--workspace-surface))] text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={onStopQualityReview}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop review
          </Button>
        ) : onRunQualityReview ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))]"
            onClick={onRunQualityReview}
          >
            <ClipboardCheck className="h-4 w-4" />
            Run Quality Review
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))]"
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
        <ScreenerEditorStatusMenu
          screenerId={screener.id}
          status={screener.status}
          majorVersion={screener.majorVersion}
          minorVersion={screener.minorVersion}
          onStatusChange={onScreenerVersionChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border/80 bg-[hsl(var(--workspace-surface))]"
              disabled={exportingWord || exportingExcel}
            >
              {exportingWord || exportingExcel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={exportingWord} onClick={handleExportWord}>
              <FileText className="h-4 w-4" />
              Export Word
            </DropdownMenuItem>
            <DropdownMenuItem disabled={exportingExcel} onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
