import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  align = "left",
  gradientTitle = true,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
  gradientTitle?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-2xl space-y-3",
          align === "center" && "mx-auto text-center",
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl",
            gradientTitle && "text-gradient",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="text-base text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
