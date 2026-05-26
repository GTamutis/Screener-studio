import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary backdrop-blur",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/15 text-destructive backdrop-blur",
        success:
          "border-transparent bg-[hsl(var(--status-success)/0.14)] text-[hsl(var(--status-success))] backdrop-blur",
        warning:
          "border-transparent bg-[hsl(var(--status-warning)/0.14)] text-[hsl(var(--status-warning))] backdrop-blur",
        info: "border-transparent bg-[hsl(var(--dos-blue)/0.12)] text-[hsl(var(--dos-blue))] backdrop-blur dark:text-[hsl(221_70%_62%)]",
        glow: "border-transparent bg-[hsl(var(--dos-glow)/0.22)] text-[hsl(251_59%_22%)] dark:text-[hsl(var(--dos-glow))] backdrop-blur",
        outline: "border-border/60 text-foreground",
        gradient:
          "border-transparent bg-brand-gradient-soft text-foreground ring-1 ring-inset ring-primary/20 backdrop-blur",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
