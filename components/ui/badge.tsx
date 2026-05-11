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
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 backdrop-blur",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300 backdrop-blur",
        info: "border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-300 backdrop-blur",
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
