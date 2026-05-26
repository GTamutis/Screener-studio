import "server-only";

import { getIndustryNews } from "@/lib/workspace/industry-news";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";

export async function getIndustryNewsArticleById(
  articleId: string,
): Promise<IndustryNewsItem | null> {
  const decodedId = decodeURIComponent(articleId);
  const { items } = await getIndustryNews();
  return items.find((item) => item.id === decodedId) ?? null;
}
