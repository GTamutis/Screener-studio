import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";

export function buildArticleBrief(item: IndustryNewsItem): string {
  const lines = [
    "## Source article",
    "",
    `**Title:** ${item.title}`,
    `**Source:** ${item.source}`,
    `**Published:** ${item.publishedAt}`,
    `**Link:** ${item.link}`,
  ];

  if (item.summary?.trim()) {
    lines.push("", `**Summary:** ${item.summary.trim()}`);
  }

  if (item.companies.length > 0) {
    lines.push("", `**Companies mentioned:** ${item.companies.join(", ")}`);
  }

  return lines.join("\n");
}

export function buildClientContextBrief(clientNames: string[]): string {
  if (clientNames.length === 0) return "";

  return [
    "## Active project clients (for reference)",
    "",
    clientNames.map((name) => `- ${name}`).join("\n"),
    "",
    "These are organisations the user currently has active projects with. The recipient may be one of these, a prospect, or someone else entirely. If the recipient matches a name here, they may have an existing Day One relationship.",
  ].join("\n");
}
