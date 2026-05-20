import { AppHeader } from "@/components/app-header";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

const NAV_ITEMS = [{ href: "/dashboard/projects", label: "Projects" }] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, isAdmin, pendingCount } =
    await getAuthenticatedShellProps();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        brandLabel="Dashboard"
        brandHref="/dashboard/projects"
        sectionRootHref="/dashboard"
        navItems={[...NAV_ITEMS]}
        displayName={displayName}
        isAdmin={isAdmin}
        pendingCount={pendingCount}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
        {children}
      </main>
    </div>
  );
}
