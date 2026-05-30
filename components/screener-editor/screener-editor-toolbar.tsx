"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Loader2,
  Save,
  Square,
  Users,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SCREENER_TOOLBAR_BUTTON_CLASS,
  SCREENER_TOOLBAR_STOP_BUTTON_CLASS,
} from "@/lib/screeners/editor-toolbar-styles";
import { openStakeholderReviewWindow } from "@/lib/screeners/stakeholder-review/paths";
import type { ScreenerWithProject } from "@/lib/screeners/types";
import { cn } from "@/lib/utils";

function ToolbarDivider() {
  return (
    <div
      className="mx-0.5 hidden h-6 w-px shrink-0 bg-border/80 sm:block"
      aria-hidden
    />
  );
}

export function ScreenerEditorToolbar({
  screener,
  onScreenerVersionChange,
  qualityReviewLoading,
  onRunQualityReview,
  onStopQualityReview,
  onOpenConsentBuilder,
}: {
  screener: ScreenerWithProject;
  onScreenerVersionChange: (snapshot: ScreenerVersionSnapshot) => void;
  qualityReviewLoading?: boolean;
  onRunQualityReview?: () => void;
  onStopQualityReview?: () => void;
  onOpenConsentBuilder?: () => void;
}) {
  const [saving, startSave] = useTransition();
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const showReviews =
    Boolean(onRunQualityReview) || Boolean(onStopQualityReview);

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
        "RecruitmentLog.xlsx",
        "Recruitment log downloaded.",
      );
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleOpenStakeholderReview = () => {
    const opened = openStakeholderReviewWindow(screener.id);
    if (!opened) {
      toast.error(
        "Pop-up blocked. Allow pop-ups for this site to open Stakeholder Review beside the editor.",
      );
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
        {onOpenConsentBuilder ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={SCREENER_TOOLBAR_BUTTON_CLASS}
            onClick={onOpenConsentBuilder}
          >
            <ListChecks className="h-4 w-4" />
            <span className="hidden md:inline">Quick Add: Consents &amp; Intro</span>
            <span className="md:hidden">Consents</span>
          </Button>
        ) : null}

        {showReviews ? (
          <>
            <ToolbarDivider />
            <div className="flex items-center gap-2">
              {qualityReviewLoading && onStopQualityReview ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={SCREENER_TOOLBAR_STOP_BUTTON_CLASS}
                  onClick={onStopQualityReview}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop review
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(SCREENER_TOOLBAR_BUTTON_CLASS, "pr-2")}
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">Reviews</span>
                      <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px]">
                    {onRunQualityReview ? (
                      <DropdownMenuItem onClick={onRunQualityReview}>
                        <ClipboardCheck className="h-4 w-4" />
                        Quality review
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleOpenStakeholderReview}>
                      <Users className="h-4 w-4" />
                      Stakeholder review
                      <span className="ml-auto text-xs text-muted-foreground">
                        New window
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        ) : null}

        <ToolbarDivider />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={SCREENER_TOOLBAR_BUTTON_CLASS}
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
                className={SCREENER_TOOLBAR_BUTTON_CLASS}
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
                Export Screener
              </DropdownMenuItem>
              <DropdownMenuItem disabled={exportingExcel} onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4" />
                Export Recruitment Log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
