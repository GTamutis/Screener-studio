import { AppHeader } from "@/components/app-header";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

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
        brandHref="/workspace"
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
