import { redirect } from "next/navigation";

import { stakeholderReviewPath } from "@/lib/screeners/stakeholder-review/paths";

export default function WorkspaceStakeholderReviewRedirect({
  params,
}: {
  params: { screenerId: string };
}) {
  redirect(stakeholderReviewPath(params.screenerId));
}
