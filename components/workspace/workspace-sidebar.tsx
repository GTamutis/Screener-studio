"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calculator,
  FileText,
  HelpCircle,
  Home,
  LayoutGrid,
  FolderKanban,
  Send,
  Users,
} from "lucide-react";

import { DayOneMark } from "@/components/brand/day-one-mark";
import { ThemeToggle } from "@/components/ui/glass/theme-toggle";
import { UserMenu } from "@/components/ui/glass/user-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

const PRIMARY_NAV: NavItem[] = [
  {
    href: "/workspace",
    label: "Workspace home",
    icon: Home,
    match: (p) => p === "/workspace" || p === "/workspace/",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    match: (p) => p === "/projects" || p.startsWith("/projects/"),
  },
];

const TOOL_NAV: NavItem[] = [
  {
    href: "/screener-studio",
    label: "Screener Studio",
    icon: FileText,
    match: (p) =>
      p.startsWith("/screener-studio") ||
      p.startsWith("/workspace/screener-studio"),
  },
  {
    href: "/invitely",
    label: "Invitely",
    icon: Send,
    match: (p) => p.startsWith("/invitely"),
  },
  {
    href: "/workspace/fair-market-values",
    label: "Fair Market Values",
    icon: Calculator,
    match: (p) => p.startsWith("/workspace/fair-market-values"),
  },
  {
    href: "/workspace",
    label: "Tools & marketplace",
    icon: LayoutGrid,
    match: () => false,
  },
];

const BOTTOM_NAV: NavItem[] = [
  {
    href: "/workspace/users",
    label: "Team",
    icon: Users,
    match: (p) => p.startsWith("/workspace/users"),
  },
  {
    href: "/workspace",
    label: "Analytics",
    icon: BarChart3,
    match: () => false,
  },
];

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.match
    ? item.match(pathname)
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors",
            "hover:bg-secondary hover:text-foreground",
            active &&
              "bg-secondary text-primary before:absolute before:-left-2 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-primary",
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="h-[18px] w-[18px] stroke-[1.5]" aria-hidden />
          <span className="sr-only">{item.label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceSidebar({
  displayName,
  isAdmin = false,
  pendingCount = 0,
}: {
  displayName: string;
  isAdmin?: boolean;
  pendingCount?: number;
}) {
  return (
    <aside className="sticky top-0 z-40 flex h-screen w-14 shrink-0 flex-col items-center border-r border-border bg-card py-4">
      <Link
        href="/workspace"
        className="mb-6 flex h-8 w-8 items-center justify-center rounded-md outline-none transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Day One Strategy workspace home"
      >
        <DayOneMark className="h-6 w-6" decorative={false} />
      </Link>

      <nav className="flex w-full flex-col items-center gap-1 px-2">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink key={item.href + item.label} item={item} />
        ))}

        <div
          role="presentation"
          aria-hidden
          className="my-2 h-px w-6 bg-border"
        />

        {TOOL_NAV.map((item) => (
          <SidebarLink key={item.href + item.label} item={item} />
        ))}
      </nav>

      <nav className="mt-auto flex w-full flex-col items-center gap-1 px-2 pb-2">
        {BOTTOM_NAV.map((item) => (
          <SidebarLink key={item.href + item.label} item={item} />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Help"
            >
              <HelpCircle className="h-[18px] w-[18px] stroke-[1.5]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Help</TooltipContent>
        </Tooltip>

        <div
          role="presentation"
          aria-hidden
          className="my-1 h-px w-6 bg-border"
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <ThemeToggle compact />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">Theme</TooltipContent>
        </Tooltip>

        <UserMenu
          displayName={displayName}
          isAdmin={isAdmin}
          pendingCount={pendingCount}
          iconOnly
        />
      </nav>
    </aside>
  );
}
