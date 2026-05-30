"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import {
  setScreenerToDraft,
  setScreenerToFinal,
  type ScreenerVersionSnapshot,
} from "@/app/actions/screeners";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  screenerDisplayStatusLabel,
  screenerToDisplayStatus,
} from "@/lib/screeners/display-status";
import type { ScreenerStatus } from "@/lib/screeners/types";
import { formatScreenerVersionLabel } from "@/lib/screeners/version";
import { cn } from "@/lib/utils";

const STYLES: Record<
  ScreenerStatus,
  { dot: string; bg: string; text: string }
> = {
  draft: {
    dot: "bg-[hsl(var(--status-warning))]",
    bg: "bg-[hsl(var(--status-warning)/0.12)]",
    text: "text-[hsl(var(--status-warning))]",
  },
  final: {
    dot: "bg-[hsl(var(--status-success))]",
    bg: "bg-[hsl(var(--status-success)/0.12)]",
    text: "text-[hsl(var(--status-success))]",
  },
};

export function ScreenerEditorStatusMenu({
  screenerId,
  status,
  majorVersion,
  minorVersion,
  onStatusChange,
}: {
  screenerId: string;
  status: ScreenerStatus;
  majorVersion: number;
  minorVersion: number;
  onStatusChange: (snapshot: ScreenerVersionSnapshot) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmFinalOpen, setConfirmFinalOpen] = useState(false);
  const display = screenerToDisplayStatus(status);
  const s = STYLES[display];
  const label = screenerDisplayStatusLabel(display);
  const versionLabel = formatScreenerVersionLabel({
    majorVersion,
    minorVersion,
    status,
  });
  const nextFinalMajor = majorVersion + 1;

  const handleSetDraft = () => {
    startTransition(async () => {
      const res = await setScreenerToDraft(screenerId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onStatusChange(res.screener);
      toast.success("Screener set to draft.");
    });
  };

  const handleConfirmFinal = () => {
    setConfirmFinalOpen(false);
    startTransition(async () => {
      const res = await setScreenerToFinal(screenerId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onStatusChange(res.screener);
      toast.success(`Screener marked as Final (v${res.screener.majorVersion}).`);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={pending}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 border-border/80 bg-[hsl(var(--workspace-panel))] text-sm font-medium shadow-sm",
              s.bg,
              s.text,
              "hover:opacity-90",
              pending && "opacity-60",
            )}
            aria-label={`Status: ${label}, ${versionLabel}. Change status`}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} aria-hidden />
            <span>
              {label} · {versionLabel}
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          {status === "final" ? (
            <DropdownMenuItem onSelect={handleSetDraft}>
              Set to Draft
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirmFinalOpen(true)}>
              Set to Final
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmFinalOpen} onOpenChange={setConfirmFinalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Final?</DialogTitle>
            <DialogDescription>
              Mark this screener as Final (v{nextFinalMajor})? This will be
              visible on all exports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmFinalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmFinal}
              disabled={pending}
            >
              Mark as Final
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
