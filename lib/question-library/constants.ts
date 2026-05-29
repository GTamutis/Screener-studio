import type { QuestionLibraryCategory } from "@/lib/question-library/types";

export type LibraryCategoryFilter =
  | "all"
  | "introduction"
  | "consent"
  | "demographics"
  | "screening"
  | "exclusion"
  | "scheduling"
  | "other";

export const LIBRARY_CATEGORY_FILTERS: {
  id: LibraryCategoryFilter;
  label: string;
  categories: QuestionLibraryCategory[] | null;
}[] = [
  { id: "all", label: "All", categories: null },
  {
    id: "introduction",
    label: "Intro",
    categories: ["introduction", "disclaimer"],
  },
  { id: "consent", label: "Consent", categories: ["consent"] },
  { id: "demographics", label: "Demographics", categories: ["demographics"] },
  {
    id: "screening",
    label: "Screening",
    categories: ["screening", "hcp_qualification"],
  },
  { id: "exclusion", label: "Exclusion", categories: ["exclusion"] },
  { id: "scheduling", label: "Scheduling", categories: ["scheduling"] },
  { id: "other", label: "Other", categories: ["other"] },
];

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  single: "Single choice",
  multi: "Multiple choice",
  open: "Open text",
  numeric: "Numeric",
  scale: "Scale",
  statement: "Statement",
  grid: "Grid",
};

/** Short labels for the screener editor library list. */
export const LIBRARY_LIST_TYPE_LABELS: Record<string, string> = {
  single: "Single",
  multi: "Multi",
  open: "Open",
  numeric: "Numeric",
  scale: "Scale",
  statement: "Statement",
  grid: "Grid",
};

export const CATEGORY_LABELS: Record<QuestionLibraryCategory, string> = {
  introduction: "Introduction",
  disclaimer: "Disclaimer",
  consent: "Consent",
  exclusion: "Exclusion",
  demographics: "Demographics",
  hcp_qualification: "HCP qualification",
  scheduling: "Scheduling",
  screening: "Screening",
  other: "Other",
};
