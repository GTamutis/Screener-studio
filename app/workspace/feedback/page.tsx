import { listWorkspaceFeedback } from "@/app/actions/feedback";
import { WorkspaceFeedbackInbox } from "@/components/workspace/workspace-feedback-inbox";
import { requireAdminAppUser } from "@/lib/auth/require";

export default async function WorkspaceFeedbackPage() {
  await requireAdminAppUser();

  const result = await listWorkspaceFeedback();
  if ("error" in result) {
    return (
      <main className="max-w-lg py-8 text-sm text-muted-foreground">
        {result.error}
      </main>
    );
  }

  return <WorkspaceFeedbackInbox entries={result} />;
}
