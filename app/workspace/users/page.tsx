import { listAppUsers } from "@/app/actions/users";
import { UsersManagement } from "@/components/users/users-management";
import { requireAdminAppUser } from "@/lib/auth/require";

export default async function WorkspaceUsersPage() {
  await requireAdminAppUser();

  const result = await listAppUsers();
  if ("error" in result) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        {result.error}
      </main>
    );
  }

  return <UsersManagement users={result} />;
}
