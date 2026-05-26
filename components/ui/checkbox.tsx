"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "peer h-5 w-5 shrink-0 rounded-md border border-input bg-card/80 shadow-sm transition-all backdrop-blur disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "hover:border-primary/60 hover:shadow-glow-primary/30 data-[state=checked]:border-transparent data-[state=checked]:bg-brand-gradient data-[state=checked]:text-white data-[state=checked]:shadow-glow-primary",
        matrix:
          "border-foreground/30 bg-muted/80 ring-1 ring-foreground/10 hover:border-[hsl(var(--dos-teal)/0.5)] hover:bg-muted data-[state=checked]:border-transparent data-[state=checked]:bg-brand-gradient data-[state=checked]:text-white data-[state=checked]:shadow-md disabled:bg-muted/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ variant }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, checkboxVariants };
