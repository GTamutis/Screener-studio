export type IndustryNewsSource = "BioSpace" | "Fierce Pharma" | string;

export type IndustryNewsItem = {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  source: IndustryNewsSource;
  summary?: string;
  /** Pharma / biotech names detected in the headline (and summary when present). */
  companies: string[];
};

export type IndustryNewsSourceCount = {
  source: string;
  count: number;
};

export type IndustryNewsResult = {
  items: IndustryNewsItem[];
  /** Sources that failed on this fetch (for partial-feed UI). */
  failedSources: string[];
  /** Items included per source after merge (for transparency). */
  sourceCounts: IndustryNewsSourceCount[];
};
