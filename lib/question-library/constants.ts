import type { QuestionLibraryCategory } from "@/lib/question-library/types";

export type LibraryCategoryFilter =
  | "all"
  | "consent"
  | "demographics"
  | "specialty"
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
    id: "consent",
    label: "Consent",
    categories: ["consent", "disclaimer"],
  },
  { id: "demographics", label: "Demographics", categories: ["demographics"] },
  {
    id: "specialty",
    label: "Specialty",
    categories: ["hcp_qualification", "screening"],
  },
  { id: "exclusion", label: "Exclusion", categories: ["exclusion"] },
  { id: "scheduling", label: "Scheduling", categories: ["scheduling"] },
  {
    id: "other",
    label: "Other",
    categories: ["other", "introduction"],
  },
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
