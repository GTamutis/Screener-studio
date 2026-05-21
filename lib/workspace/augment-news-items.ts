import { extractMentionedCompanies } from "@/lib/workspace/extract-companies";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";

/** Add project client names mentioned in headline text to company tags. */
export function augmentNewsItemsWithClients(
  items: IndustryNewsItem[],
  clientNames: string[],
): IndustryNewsItem[] {
  if (clientNames.length === 0) return items;

  return items.map((item) => {
    const text = [item.title, item.summary].filter(Boolean).join(" ");
    const fromClients = extractMentionedCompanies(text, clientNames);
    const companies = Array.from(
      new Set([...item.companies, ...fromClients]),
    ).sort((a, b) => a.localeCompare(b));

    return { ...item, companies };
  });
}
