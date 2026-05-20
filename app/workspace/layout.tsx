import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, isAdmin, pendingCount } =
    await getAuthenticatedShellProps();

  return (
    <div className="flex min-h-screen gap-0 bg-[hsl(var(--workspace-surface))]">
      <WorkspaceSidebar
        displayName={displayName}
        isAdmin={isAdmin}
        pendingCount={pendingCount}
      />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
