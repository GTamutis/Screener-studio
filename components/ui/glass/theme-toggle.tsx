"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (theme === "system" ? resolvedTheme : theme) : null;
  const isDark = current === "dark";

  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  if (compact) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
          className,
        )}
      >
        {mounted ? (
          isDark ? (
            <Sun className="h-[18px] w-[18px] stroke-[1.5]" />
          ) : (
            <Moon className="h-[18px] w-[18px] stroke-[1.5]" />
          )
        ) : (
          <Moon className="h-[18px] w-[18px] stroke-[1.5] opacity-0" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="glass"
      size="icon"
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("rounded-full", className)}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <Sun className="h-4 w-4 opacity-0" />
      )}
    </Button>
  );
}
