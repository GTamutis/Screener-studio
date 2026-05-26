import "server-only";

import { getIndustryNews } from "@/lib/workspace/industry-news";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";

function safeDecodeArticleId(articleId: string): string | null {
  try {
    return decodeURIComponent(articleId);
  } catch {
    return null;
  }
}

export async function getIndustryNewsArticleById(
  articleId: string,
): Promise<IndustryNewsItem | null> {
  const possibleIds = new Set([articleId]);
  const decodedId = safeDecodeArticleId(articleId);
  if (decodedId) possibleIds.add(decodedId);

  const { items } = await getIndustryNews();
  return items.find((item) => possibleIds.has(item.id)) ?? null;
}
