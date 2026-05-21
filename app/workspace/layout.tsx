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
    <div
      data-workspace-shell
      className="flex h-dvh max-h-dvh overflow-hidden bg-[hsl(var(--workspace-surface))]"
    >
      <WorkspaceSidebar
        displayName={displayName}
        isAdmin={isAdmin}
        pendingCount={pendingCount}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain">
        {children}
      </main>
    </div>
  );
}
