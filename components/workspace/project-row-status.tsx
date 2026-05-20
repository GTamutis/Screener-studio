import { cn } from "@/lib/utils";

export type ProjectRowStatus = "active" | "setup" | "draft" | "done";

const STYLES: Record<
  ProjectRowStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  active: {
    label: "In field",
    dot: "bg-[hsl(var(--dos-blue))]",
    bg: "bg-[hsl(var(--dos-blue)/0.1)]",
    text: "text-[hsl(var(--dos-blue))]",
  },
  setup: {
    label: "Setup",
    dot: "bg-[hsl(var(--dos-teal))]",
    bg: "bg-[hsl(var(--dos-teal)/0.12)]",
    text: "text-[hsl(215_52%_30%)] dark:text-[hsl(var(--dos-teal))]",
  },
  draft: {
    label: "Draft",
    dot: "bg-[hsl(var(--status-warning))]",
    bg: "bg-[hsl(var(--status-warning)/0.12)]",
    text: "text-[hsl(var(--status-warning))]",
  },
  done: {
    label: "Done",
    dot: "bg-muted-foreground/50",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
};

/** Display status until project lifecycle is stored in the database. */
export function projectStatusFromCreatedAt(createdAt: string): ProjectRowStatus {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return "active";

  const ageDays = (Date.now() - created) / (24 * 60 * 60 * 1000);
  if (ageDays < 3) return "setup";
  if (ageDays > 90) return "done";
  if (ageDays > 60) return "draft";
  return "active";
}

export function ProjectRowStatusBadge({ status }: { status: ProjectRowStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
        s.bg,
        s.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}
