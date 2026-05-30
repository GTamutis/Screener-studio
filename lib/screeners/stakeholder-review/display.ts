import type {
  StakeholderReviewPersona,
  StakeholderReviewSeverity,
} from "@/lib/screeners/stakeholder-review/constants";

export const STAKEHOLDER_PERSONA_LABELS: Record<StakeholderReviewPersona, string> =
  {
    market_research_lead: "Market Research Lead",
    marketing_lead: "Marketing Lead",
    legal_regulatory: "Legal & Regulatory",
    medical: "Medical",
  };

export const SEVERITY_DOT_COLORS: Record<StakeholderReviewSeverity, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-600",
};

export const SEVERITY_CELL_BG: Record<"amber" | "red" | "none", string> = {
  none: "",
  amber: "bg-[#FFFBEB]",
  red: "bg-[#FEF2F2]",
};

export const SEVERITY_BADGE_CLASSES: Record<StakeholderReviewSeverity, string> = {
  green:
    "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  amber: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  red: "bg-red-100 text-red-800 ring-1 ring-red-200",
};

export function previewQuestionWords(text: string, wordCount = 6): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const slice = words.slice(0, wordCount).join(" ");
  return words.length > wordCount ? `${slice}…` : slice;
}

export function formatStakeholderReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function cellSeverityRank(
  severity: StakeholderReviewSeverity | null,
): number {
  if (severity === "red") return 2;
  if (severity === "amber") return 1;
  return 0;
}

export function maxSeverity(
  a: StakeholderReviewSeverity | null,
  b: StakeholderReviewSeverity | null,
): StakeholderReviewSeverity {
  return cellSeverityRank(a) >= cellSeverityRank(b) ? (a ?? "green") : (b ?? "green");
}
