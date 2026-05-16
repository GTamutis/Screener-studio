import { AppHeader, type AppHeaderNavItem } from "@/components/app-header";

export type SectionNavItem = AppHeaderNavItem;

export function SectionShell({
  brandLabel,
  brandHref,
  sectionRootHref,
  navItems,
  displayName,
  isAdmin = false,
  pendingCount = 0,
  children,
  mainClassName,
}: {
  brandLabel: string;
  brandHref: string;
  sectionRootHref: string;
  navItems: readonly SectionNavItem[];
  displayName: string;
  isAdmin?: boolean;
  pendingCount?: number;
  children: React.ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        brandLabel={brandLabel}
        brandHref={brandHref}
        sectionRootHref={sectionRootHref}
        navItems={navItems}
        displayName={displayName}
        isAdmin={isAdmin}
        pendingCount={pendingCount}
      />
      <main
        className={
          mainClassName ??
          "mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-14"
        }
      >
        {children}
      </main>
    </div>
  );
}
