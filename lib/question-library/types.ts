export type QuestionLibraryCategory =
  | "introduction"
  | "disclaimer"
  | "consent"
  | "exclusion"
  | "demographics"
  | "hcp_qualification"
  | "scheduling"
  | "screening"
  | "other";

export type QuestionLibraryType =
  | "single"
  | "multi"
  | "open"
  | "numeric"
  | "scale"
  | "statement"
  | "grid";

export type QuestionAnswerOption = {
  text: string;
  terminate?: boolean;
};

export type QuestionLibraryStatus = "draft" | "approved" | "archived";

export type QuestionLibraryItem = {
  id: string;
  displayId: string | null;
  questionText: string;
  questionType: QuestionLibraryType;
  answerOptions: QuestionAnswerOption[];
  category: QuestionLibraryCategory;
  tags: string[] | null;
  isLocked: boolean;
  language: string;
  notes: string | null;
};

export type AdminQuestionLibraryItem = QuestionLibraryItem & {
  status: QuestionLibraryStatus;
  sector: string[] | null;
  methodology: string[] | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestionLibraryRow = {
  id: string;
  display_id: string | null;
  question_text: string;
  question_type: QuestionLibraryType;
  answer_options: QuestionAnswerOption[] | null;
  category: QuestionLibraryCategory;
  tags: string[] | null;
  sector: string[] | null;
  methodology: string[] | null;
  is_locked: boolean;
  language: string;
  notes: string | null;
  status: QuestionLibraryStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapQuestionLibraryRow(row: QuestionLibraryRow): QuestionLibraryItem {
  return {
    id: row.id,
    displayId: row.display_id,
    questionText: row.question_text,
    questionType: row.question_type,
    answerOptions: Array.isArray(row.answer_options) ? row.answer_options : [],
    category: row.category,
    tags: row.tags,
    isLocked: row.is_locked,
    language: row.language,
    notes: row.notes,
  };
}

export function mapAdminQuestionLibraryRow(
  row: QuestionLibraryRow,
): AdminQuestionLibraryItem {
  return {
    ...mapQuestionLibraryRow(row),
    status: row.status,
    sector: row.sector,
    methodology: row.methodology,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
