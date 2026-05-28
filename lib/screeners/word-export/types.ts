import type { QuestionLibraryCategory } from "@/lib/question-library/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import type { ScreenerWithProject } from "@/lib/screeners/types";

export type ExportQuestion = ScreenerQuestion & {
  category: QuestionLibraryCategory | null;
};

export type WordExportPayload = {
  screener: ScreenerWithProject;
  questions: ExportQuestion[];
};

export type DocumentSectionKey =
  | "introduction"
  | "disclaimer"
  | "consent"
  | "screener"
  | "scheduling"
  | "closing";

export const SECTION_HEADINGS: Record<DocumentSectionKey, string> = {
  introduction: "INTRODUCTION",
  disclaimer: "DISCLAIMERS",
  consent: "ADDITIONAL CONSENTS",
  screener: "SCREENER QUESTIONS",
  scheduling: "SCHEDULING",
  closing: "CLOSING",
};

export function categoryToSection(
  category: QuestionLibraryCategory | null,
  questionType: ScreenerQuestion["questionType"],
): DocumentSectionKey {
  switch (category) {
    case "introduction":
      return "introduction";
    case "disclaimer":
      return "disclaimer";
    case "consent":
      return "consent";
    case "scheduling":
      return "scheduling";
    case "exclusion":
    case "demographics":
    case "hcp_qualification":
    case "screening":
    case "other":
      return "screener";
    default:
      if (questionType === "statement") return "introduction";
      return "screener";
  }
}
