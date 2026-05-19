import type { QuestionLibraryCategory } from "@/lib/question-library/types";

export const ADMIN_FORM_QUESTION_TYPES = [
  "single",
  "multi",
  "open",
  "numeric",
  "scale",
  "statement",
] as const;

export type AdminFormQuestionType =
  (typeof ADMIN_FORM_QUESTION_TYPES)[number];

export const ADMIN_FORM_CATEGORIES = [
  { value: "consent", label: "Consent", db: "consent" as const },
  { value: "demographics", label: "Demographics", db: "demographics" as const },
  { value: "specialty", label: "Specialty", db: "hcp_qualification" as const },
  { value: "exclusion", label: "Exclusion", db: "exclusion" as const },
  { value: "scheduling", label: "Scheduling", db: "scheduling" as const },
  { value: "other", label: "Other", db: "other" as const },
] as const;

export type AdminFormCategory =
  (typeof ADMIN_FORM_CATEGORIES)[number]["value"];

export const ADMIN_SECTOR_OPTIONS = [
  "Healthcare",
  "Consumer",
  "B2B",
  "All",
] as const;

export type AdminSectorOption = (typeof ADMIN_SECTOR_OPTIONS)[number];

export const ADMIN_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "archived", label: "Archived" },
] as const;

export type AdminQuestionStatus =
  (typeof ADMIN_STATUS_OPTIONS)[number]["value"];

export function questionTypeShowsAnswerOptions(type: string): boolean {
  return type === "single" || type === "multi" || type === "scale";
}

export function formCategoryToDb(
  category: AdminFormCategory,
): QuestionLibraryCategory {
  const match = ADMIN_FORM_CATEGORIES.find((c) => c.value === category);
  return match?.db ?? "other";
}

export function dbCategoryToForm(
  category: QuestionLibraryCategory,
): AdminFormCategory {
  if (
    category === "hcp_qualification" ||
    category === "screening"
  ) {
    return "specialty";
  }
  if (category === "disclaimer") return "consent";
  if (category === "introduction") return "other";
  if (category === "consent") return "consent";
  if (category === "demographics") return "demographics";
  if (category === "exclusion") return "exclusion";
  if (category === "scheduling") return "scheduling";
  return "other";
}

export function sectorsToFormValue(sectors: string[] | null): AdminSectorOption[] {
  if (!sectors?.length) return ["All"];
  return sectors.filter((s): s is AdminSectorOption =>
    ADMIN_SECTOR_OPTIONS.includes(s as AdminSectorOption),
  );
}

export function formSectorsToDb(selected: AdminSectorOption[]): string[] | null {
  if (selected.includes("All") || selected.length === 0) return null;
  return selected.filter((s) => s !== "All");
}
