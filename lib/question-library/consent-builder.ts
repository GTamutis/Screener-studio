import type {
  QuestionLibraryCategory,
  QuestionLibraryItem,
} from "@/lib/question-library/types";

export type ConsentBuilderGroupKey = "introduction" | "disclaimer" | "consent";

export const CONSENT_BUILDER_GROUPS: {
  key: ConsentBuilderGroupKey;
  heading: string;
}[] = [
  { key: "introduction", heading: "Introduction" },
  { key: "disclaimer", heading: "Disclaimer" },
  { key: "consent", heading: "Consent" },
];

function hasDisclaimerTagFromTags(tags: string[] | null | undefined): boolean {
  return (tags ?? []).some((tag) => tag.trim().toLowerCase() === "disclaimer");
}

function hasDisclaimerTag(question: QuestionLibraryItem): boolean {
  return hasDisclaimerTagFromTags(question.tags);
}

export function isConsentBuilderCategoryAndTags(
  category: QuestionLibraryCategory,
  tags: string[] | null | undefined,
): boolean {
  if (category === "consent") return true;
  if (category === "disclaimer" || hasDisclaimerTagFromTags(tags)) return true;
  if (category === "introduction") return true;
  return false;
}

/** Maps a library question into the consent builder group, if any. */
export function getConsentBuilderGroup(
  question: QuestionLibraryItem,
): ConsentBuilderGroupKey | null {
  if (question.category === "consent") return "consent";
  if (question.category === "disclaimer" || hasDisclaimerTag(question)) {
    return "disclaimer";
  }
  if (question.category === "introduction") return "introduction";
  return null;
}

export function isConsentBuilderLibraryQuestion(
  question: QuestionLibraryItem,
): boolean {
  return getConsentBuilderGroup(question) !== null;
}

export function groupConsentBuilderQuestions(
  questions: QuestionLibraryItem[],
): Record<ConsentBuilderGroupKey, QuestionLibraryItem[]> {
  const grouped: Record<ConsentBuilderGroupKey, QuestionLibraryItem[]> = {
    introduction: [],
    disclaimer: [],
    consent: [],
  };

  for (const question of questions) {
    const group = getConsentBuilderGroup(question);
    if (group) grouped[group].push(question);
  }

  return grouped;
}

export function firstEightWords(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length <= 8) return words.join(" ");
  return `${words.slice(0, 8).join(" ")}…`;
}

export function consentBuilderRowLabel(question: QuestionLibraryItem): string {
  const id = question.displayId?.trim() || "—";
  const short = firstEightWords(question.questionText);
  return `${id} — ${short}`;
}

/** Flat list in display order: Introduction → Disclaimer → Consent. */
export function flattenConsentBuilderQuestions(
  questions: QuestionLibraryItem[],
): QuestionLibraryItem[] {
  const grouped = groupConsentBuilderQuestions(questions);
  return CONSENT_BUILDER_GROUPS.flatMap(({ key }) => grouped[key]);
}
