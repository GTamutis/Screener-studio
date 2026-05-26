"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  value: string;
  label: string;
};

export function FilterSelect({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  disabled,
  size = "default",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly FilterSelectOption[];
  "aria-label": string;
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "justify-between gap-2 rounded-lg border-input bg-card font-normal shadow-sm hover:bg-card/90",
            size === "sm" ? "h-8 min-w-[7.5rem] px-2.5 text-xs" : "h-10 min-w-[8rem] px-3 text-sm",
            className,
          )}
        >
          <span className="truncate">{selected?.label ?? "Choose…"}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-60 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-2xl p-1.5"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="rounded-lg"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
