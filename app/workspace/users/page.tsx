import { listAppUsers } from "@/app/actions/users";
import { UsersManagement } from "@/components/users/users-management";
import { requireAdminAppUser } from "@/lib/auth/require";

export default async function WorkspaceUsersPage() {
  await requireAdminAppUser();

  const result = await listAppUsers();
  if ("error" in result) {
    return (
      <main className="max-w-lg py-8 text-sm text-muted-foreground">
        {result.error}
      </main>
    );
  }

  return <UsersManagement users={result} />;
}
