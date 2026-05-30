import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getScreenerById } from "@/app/actions/screeners";
import { getStakeholderReviewPageData } from "@/app/actions/stakeholder-reviews";
import { StakeholderReviewPage } from "@/components/stakeholder-review/stakeholder-review-page";

export async function generateMetadata({
  params,
}: {
  params: { screenerId: string };
}): Promise<Metadata> {
  try {
    const screener = await getScreenerById(params.screenerId);
    const result = await getStakeholderReviewPageData(
      screener.projectId,
      params.screenerId,
    );
    if ("error" in result) {
      return { title: "Stakeholder Review" };
    }
    return {
      title: `${result.screenerName} · Stakeholder Review`,
    };
  } catch {
    return { title: "Stakeholder Review" };
  }
}

export default async function StakeholderReviewPopupPage({
  params,
}: {
  params: { screenerId: string };
}) {
  let projectId: string;
  try {
    const screener = await getScreenerById(params.screenerId);
    projectId = screener.projectId;
  } catch {
    notFound();
  }

  const result = await getStakeholderReviewPageData(
    projectId,
    params.screenerId,
  );

  if ("error" in result) {
    if (/not found/i.test(result.error)) notFound();
    throw new Error(result.error);
  }

  return <StakeholderReviewPage initialData={result} variant="popup" />;
}
