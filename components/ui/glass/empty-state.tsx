import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconVariant = "gradient",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** gradient = hero glow; flat = teal accent (bulk tools, lists) */
  iconVariant?: "gradient" | "flat";
}) {
  return (
    <GlassCard
      className={cn(
        "flex flex-col items-center gap-4 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="relative">
          {iconVariant === "gradient" ? (
            <div className="absolute inset-0 -z-10 rounded-full bg-brand-gradient opacity-25 blur-2xl" />
          ) : null}
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              iconVariant === "gradient"
                ? "bg-brand-gradient text-white shadow-glow-primary"
                : "bg-[hsl(var(--dos-teal)/0.12)] text-[hsl(var(--dos-navy))] ring-1 ring-inset ring-[hsl(var(--dos-teal)/0.25)] dark:text-[hsl(var(--dos-teal))]",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </GlassCard>
  );
}
