import type { WorkspaceMetrics } from "@/lib/workspace/metrics";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

const CARDS: {
  key: keyof WorkspaceMetrics;
  label: string;
  hint?: string;
}[] = [
  { key: "active", label: "Active" },
  { key: "inField", label: "In field", hint: "Field status coming soon" },
  { key: "setup", label: "Setup" },
  { key: "done30d", label: "Done 30d", hint: "Projects older than 30 days" },
];

export function WorkspaceMetricCards({
  metrics,
  className,
}: {
  metrics: WorkspaceMetrics;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 lg:grid-cols-4",
        className,
      )}
    >
      {CARDS.map(({ key, label, hint }) => (
        <article
          key={key}
          title={hint}
          className={cn(
            workspaceCardClassName,
            "flex flex-col gap-2 px-5 py-4 transition-shadow hover:shadow-glass-sm border-l-[3px] border-l-[hsl(var(--dos-navy))]",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {metrics[key]}
          </p>
        </article>
      ))}
    </div>
  );
}
