import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
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
          <div className="absolute inset-0 -z-10 rounded-full bg-brand-gradient opacity-25 blur-2xl" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
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
