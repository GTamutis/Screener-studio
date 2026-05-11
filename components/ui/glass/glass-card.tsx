import * as React from "react";

import { cn } from "@/lib/utils";

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    accent?: boolean;
  }
>(({ className, interactive, accent, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative rounded-2xl glass-surface shadow-glass-sm transition-all duration-300",
      interactive &&
        "hover:-translate-y-0.5 hover:shadow-glass hover:border-foreground/15 dark:hover:border-white/15",
      accent && "bg-brand-gradient-soft",
      className,
    )}
    {...props}
  >
    {interactive ? (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--brand-from) / 0.08), hsl(var(--brand-via) / 0.08) 50%, hsl(var(--brand-to) / 0.08))",
        }}
      />
    ) : null}
    <div className="relative">{children}</div>
  </div>
));
GlassCard.displayName = "GlassCard";

export { GlassCard };
