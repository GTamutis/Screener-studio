import { redirect } from "next/navigation";

export default function DashboardStakeholderReviewRedirect({
  params,
}: {
  params: { projectId: string; screenerId: string };
}) {
  redirect(
    `/workspace/screener-studio/${params.screenerId}/stakeholder-review`,
  );
}
