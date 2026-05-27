"use client";

import Link from "next/link";
import { Inbox, LogOut, Moon, Sun, User as UserIcon, Users } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function initialsOf(displayName: string): string {
  const parts = displayName
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({
  displayName,
  isAdmin = false,
  pendingCount = 0,
  minimal = false,
  iconOnly = false,
}: {
  displayName: string;
  isAdmin?: boolean;
  pendingCount?: number;
  minimal?: boolean;
  iconOnly?: boolean;
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === "system" ? resolvedTheme : theme) : null;
  const isDark = current === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative transition",
            iconOnly
              ? "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              : "flex items-center gap-2 rounded-full glass-surface py-1 pl-1 pr-3 hover:border-foreground/20 hover:shadow-glass-sm",
          )}
          aria-label="Account menu"
        >
          <Avatar className={iconOnly ? "h-7 w-7" : "h-7 w-7"}>
            <AvatarFallback className={iconOnly ? "text-xs" : undefined}>
              {initialsOf(displayName)}
            </AvatarFallback>
          </Avatar>
          {!iconOnly ? (
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:inline">
              {displayName}
            </span>
          ) : null}
          {isAdmin && pendingCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={iconOnly ? "start" : "end"}
        side={iconOnly ? "right" : "bottom"}
        className="w-56"
      >
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <div className="px-2 pb-2 pt-1">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{displayName}</span>
          </p>
        </div>
        {(!minimal || iconOnly) && isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/workspace/users" className="cursor-pointer">
                <Users className="h-4 w-4" />
                <span>Users</span>
                {pendingCount > 0 ? (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {pendingCount} pending
                  </Badge>
                ) : null}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/workspace/feedback" className="cursor-pointer">
                <Inbox className="h-4 w-4" />
                <span>Feedback inbox</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        {!minimal && !iconOnly ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setTheme(isDark ? "light" : "dark");
              }}
            >
              {mounted && isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{mounted && isDark ? "Light mode" : "Dark mode"}</span>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => {
            void signOut({ redirectUrl: "/sign-in" });
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
