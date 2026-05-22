import "server-only";

import { unstable_cache } from "next/cache";
import Parser from "rss-parser";

import { extractMentionedCompanies } from "@/lib/workspace/extract-companies";
import type {
  IndustryNewsItem,
  IndustryNewsResult,
  IndustryNewsSource,
} from "@/lib/workspace/industry-news-types";

const CACHE_TAG = "industry-news-v2";
const REVALIDATE_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_PER_SOURCE = 30;
const MAX_TOTAL_ITEMS = 60;

const USER_AGENT =
  "Mozilla/5.0 (compatible; DayOne-ScreenerStudio/1.0; +https://dayonestrategy.com)";

const DEFAULT_FEEDS: { url: string; source: IndustryNewsSource }[] = [
  { url: "https://www.biospace.com/all-news.rss", source: "BioSpace" },
  { url: "https://www.fiercepharma.com/rss/xml", source: "Fierce Pharma" },
];

type FeedConfig = { url: string; source: IndustryNewsSource };

const parser = new Parser({
  customFields: {
    item: [],
  },
});

function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseFeedConfigsFromEnv(): FeedConfig[] {
  const raw = process.env.INDUSTRY_NEWS_FEED_URLS?.trim();
  if (!raw) return DEFAULT_FEEDS;

  const configs: FeedConfig[] = [];
  for (const segment of raw.split(",")) {
    const entry = segment.trim();
    if (!entry) continue;

    const pipe = entry.indexOf("|");
    if (pipe > 0) {
      const url = entry.slice(0, pipe).trim();
      const source = entry.slice(pipe + 1).trim();
      const safeUrl = normalizeHttpUrl(url);
      if (safeUrl && source) {
        configs.push({ url: safeUrl, source });
      } else {
        console.warn("[industry-news] Skipping invalid feed URL:", url);
      }
      continue;
    }

    const url = normalizeHttpUrl(entry);
    if (!url) {
      console.warn("[industry-news] Skipping invalid feed URL:", entry);
      continue;
    }

    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const source =
        host.includes("biospace")
          ? "BioSpace"
          : host.includes("fiercepharma")
            ? "Fierce Pharma"
            : host;
      configs.push({ url, source });
    } catch {
      console.warn("[industry-news] Skipping invalid feed URL:", url);
    }
  }

  return configs.length > 0 ? configs : DEFAULT_FEEDS;
}

/** RSS parsers sometimes return nested objects (e.g. Fierce Pharma title as link node). */
function normalizeRssText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim() || null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = normalizeRssText(entry);
      if (text) return text;
    }
    return null;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj._ === "string" && obj._.trim()) return obj._.trim();
    if (typeof obj["#text"] === "string" && obj["#text"].trim())
      return obj["#text"].trim();
    if (obj.a != null) return normalizeRssText(obj.a);
    if (obj["#text"] != null) return normalizeRssText(obj["#text"]);
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Fierce Pharma uses e.g. "May 21, 2026 1:10pm" — not parseable by `Date` in Node. */
function parseFierceStylePubDate(value: string): Date | null {
  const match = value.trim().match(
    /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i,
  );
  if (!match) return null;

  const month = MONTH_INDEX[match[1].toLowerCase()];
  if (month === undefined) return null;

  const day = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  let hour = Number.parseInt(match[4], 10);
  const minute = Number.parseInt(match[5], 10);
  const meridiem = match[6].toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  const date = new Date(year, month, day, hour, minute, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function normalizePublishedAt(
  isoDate?: string,
  pubDate?: string,
): string | null {
  const candidates = [isoDate, pubDate].filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const fierce = parseFierceStylePubDate(trimmed);
    if (fierce) return fierce.toISOString();
  }

  return null;
}

function itemId(link: string, guid?: string): string {
  const g = guid?.trim();
  if (g) return g;
  return link;
}

async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();
    if (
      text.includes("cf-browser-verification") ||
      text.includes("you have been blocked")
    ) {
      throw new Error("Blocked by publisher (Cloudflare)");
    }
    if (!text.includes("<rss") && !text.includes("<feed")) {
      throw new Error("Response is not RSS/Atom XML");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseFeed(config: FeedConfig): Promise<IndustryNewsItem[]> {
  const xml = await fetchFeedXml(config.url);
  const feed = await parser.parseString(xml);
  const items: IndustryNewsItem[] = [];

  for (const entry of feed.items ?? []) {
    const title = normalizeRssText(entry.title);
    const rawLink = normalizeRssText(entry.link) ?? normalizeRssText(entry.guid);
    const link = rawLink ? normalizeHttpUrl(rawLink) : null;
    if (!title || !link) continue;

    const publishedAt = normalizePublishedAt(entry.isoDate, entry.pubDate);
    if (!publishedAt) continue;

    const rawDesc =
      normalizeRssText(entry.contentSnippet) ??
      normalizeRssText(entry.content) ??
      normalizeRssText(entry.summary);

    const guid = normalizeRssText(entry.guid) ?? undefined;
    const summary = rawDesc ? stripHtml(rawDesc).slice(0, 280) : undefined;
    const companies = extractMentionedCompanies(
      [title, summary].filter(Boolean).join(" "),
    );

    items.push({
      id: itemId(link, guid),
      title,
      link,
      publishedAt,
      source: config.source,
      summary,
      companies,
    });
  }

  return items;
}

function mergeAndLimit(all: IndustryNewsItem[]): IndustryNewsItem[] {
  const byLink = new Map<string, IndustryNewsItem>();

  for (const item of all) {
    const existing = byLink.get(item.link);
    if (!existing || item.publishedAt > existing.publishedAt) {
      byLink.set(item.link, item);
    }
  }

  const deduped = Array.from(byLink.values());
  const bySource = new Map<string, IndustryNewsItem[]>();

  for (const item of deduped) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }

  for (const list of Array.from(bySource.values())) {
    list.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  const balanced: IndustryNewsItem[] = [];
  const usedLinks = new Set<string>();

  for (const list of Array.from(bySource.values())) {
    for (const item of list.slice(0, MAX_PER_SOURCE)) {
      if (usedLinks.has(item.link)) continue;
      usedLinks.add(item.link);
      balanced.push(item);
    }
  }

  return balanced
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, MAX_TOTAL_ITEMS);
}

async function fetchIndustryNewsUncached(): Promise<IndustryNewsResult> {
  const configs = parseFeedConfigsFromEnv();
  const failedSources: string[] = [];
  const collected: IndustryNewsItem[] = [];

  const results = await Promise.allSettled(
    configs.map(async (config) => {
      const items = await parseFeed(config);
      return { config, items };
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const config = configs[i];

    if (result.status === "fulfilled") {
      collected.push(...result.value.items);
    } else {
      failedSources.push(config.source);
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      console.warn(
        `[industry-news] Feed failed (${config.source}, ${config.url}): ${reason}`,
      );
    }
  }

  const items = mergeAndLimit(collected);
  const countMap = new Map<string, number>();
  for (const item of items) {
    countMap.set(item.source, (countMap.get(item.source) ?? 0) + 1);
  }
  const sourceCounts = Array.from(countMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => a.source.localeCompare(b.source));

  return {
    items,
    failedSources,
    sourceCounts,
  };
}

const getCachedIndustryNews = unstable_cache(
  fetchIndustryNewsUncached,
  [CACHE_TAG],
  { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] },
);

export async function getIndustryNews(): Promise<IndustryNewsResult> {
  return getCachedIndustryNews();
}
