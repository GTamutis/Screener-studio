import {
  PHARMA_COMPANIES,
  type PharmaCompanyEntry,
} from "@/lib/workspace/pharma-companies";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatchers(
  catalog: PharmaCompanyEntry[],
  extraClientNames: string[] = [],
): { displayName: string; pattern: RegExp }[] {
  const entries: PharmaCompanyEntry[] = [
    ...catalog,
    ...extraClientNames
      .map((name) => name.trim())
      .filter((name) => name.length >= 3)
      .map((name) => ({
        id: `client-${name.toLowerCase().replace(/\s+/g, "-")}`,
        displayName: name,
        aliases: [name],
      })),
  ];

  const matchers: { displayName: string; pattern: RegExp }[] = [];

  for (const entry of entries) {
    const aliases = Array.from(new Set(entry.aliases)).sort(
      (a, b) => b.length - a.length,
    );
    for (const alias of aliases) {
      if (alias.length < 2) continue;
      const pattern = new RegExp(
        `(?:^|[^a-zA-Z0-9])${escapeRegExp(alias)}(?:[^a-zA-Z0-9]|$)`,
        "i",
      );
      matchers.push({ displayName: entry.displayName, pattern });
    }
  }

  return matchers.sort(
    (a, b) => b.pattern.source.length - a.pattern.source.length,
  );
}

/** Detect pharma (and optional client) names mentioned in headline text. */
export function extractMentionedCompanies(
  text: string,
  extraClientNames: string[] = [],
): string[] {
  if (!text.trim()) return [];

  const matchers = buildMatchers(PHARMA_COMPANIES, extraClientNames);
  const found = new Set<string>();

  for (const { displayName, pattern } of matchers) {
    if (pattern.test(text)) {
      found.add(displayName);
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b));
}
