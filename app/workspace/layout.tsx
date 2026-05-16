import { AppHeader } from "@/components/app-header";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, isAdmin, pendingCount } =
    await getAuthenticatedShellProps();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        brandLabel="Workspace"
        brandHref="/workspace"
        displayName={displayName}
        isAdmin={isAdmin}
        pendingCount={pendingCount}
      />
      {children}
    </div>
  );
}
