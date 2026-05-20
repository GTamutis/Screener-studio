import { redirect } from "next/navigation";

export default function ScreenerDetailPage({
  params,
}: {
  params: { projectId: string; screenerId: string };
}) {
  redirect(`/workspace/screener-studio/${params.screenerId}`);
}
