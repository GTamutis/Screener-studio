import {
  screenerDisplayStatusLabel,
  screenerToDisplayStatus,
  type ScreenerDisplayStatus,
} from "@/lib/screeners/display-status";
import type { ScreenerStatus } from "@/lib/screeners/types";
import { cn } from "@/lib/utils";

const STYLES: Record<
  ScreenerDisplayStatus,
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

export function ScreenerStatusBadge({ status }: { status: ScreenerStatus }) {
  const display = screenerToDisplayStatus(status);
  const s = STYLES[display];
  const label = screenerDisplayStatusLabel(display);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
        s.bg,
        s.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {label}
    </span>
  );
}
