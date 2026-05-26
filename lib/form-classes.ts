import { cn } from "@/lib/utils";

/** Native select — matches Input radius (rounded-lg). */
export const selectClassName = cn(
  "h-10 min-w-[8rem] rounded-lg border border-input bg-card px-3 pr-9 text-sm text-foreground shadow-sm transition-colors",
  "appearance-none bg-[length:1rem] bg-[position:right_0.65rem_center] bg-no-repeat",
  "bg-[image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
  "hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--workspace-surface))]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/** Compact filter selects (news feed toolbar). */
export const selectClassNameSm = cn(
  selectClassName,
  "h-8 min-w-0 px-2.5 pr-8 text-xs",
);

/** Workspace elevated surface on tinted shell background. */
export const workspaceCardClassName =
  "rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_hsl(var(--dos-navy)/0.04),0_4px_16px_-4px_hsl(var(--dos-navy)/0.08)]";
