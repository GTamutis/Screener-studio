"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { computeFloatingPanelPosition } from "@/lib/screeners/stakeholder-review/popup-position";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 320;

export function StakeholderReviewFloatingPanel({
  open,
  anchorRect,
  onClose,
  title,
  titleId,
  children,
  className,
}: {
  open: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  title: React.ReactNode;
  titleId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<ReturnType<
    typeof computeFloatingPanelPosition
  > | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRect) {
      setPosition(null);
      return;
    }

    const update = () => {
      setPosition(
        computeFloatingPanelPosition({
          anchorRect,
          panelWidth: PANEL_WIDTH,
        }),
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRect]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPointer = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  if (!mounted || !open || !anchorRect || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      className={cn(
        "fixed z-[300] flex w-80 flex-col overflow-hidden rounded-lg border border-border/80 bg-[hsl(var(--workspace-panel))] text-foreground shadow-lg",
        className,
      )}
      style={{
        top: position.top,
        left: position.left,
        maxHeight: position.maxHeight,
      }}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/80 bg-[hsl(var(--workspace-panel))] px-4 py-3">
        <div className="min-w-0 flex-1" id={titleId}>
          {title}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {children}
      </div>
    </div>,
    document.body,
  );
}
