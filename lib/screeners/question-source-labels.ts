import type { ScreenerQuestionSource } from "@/lib/screeners/question-types";

const SOURCE_LABEL: Record<ScreenerQuestionSource, string> = {
  library: "Library",
  manual: "Manual",
  ai_draft: "AI Draft",
};

export function screenerQuestionSourceLabel(
  source: ScreenerQuestionSource,
): string {
  return SOURCE_LABEL[source] ?? source;
}

/** Tailwind classes for source badges on question cards */
export function screenerQuestionSourceBadgeClass(
  source: ScreenerQuestionSource,
): string {
  switch (source) {
    case "library":
      return "bg-blue-100 text-blue-800 ring-blue-200/80 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-400/30";
    case "manual":
      return "bg-gray-100 text-gray-700 ring-gray-200/80 dark:bg-gray-500/20 dark:text-gray-200 dark:ring-gray-400/30";
    case "ai_draft":
      return "bg-amber-100 text-amber-900 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}
