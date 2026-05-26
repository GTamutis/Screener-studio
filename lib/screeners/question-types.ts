import type {
  QuestionAnswerOption,
  QuestionLibraryType,
} from "@/lib/question-library/types";
import type { ScreenerQuestionQuotaConfig } from "@/lib/screeners/question-quotas";
import { normalizeQuotaConfig } from "@/lib/screeners/question-quotas";

export type ScreenerQuestionSource = "library" | "manual" | "ai_draft";

export interface ScreenerQuestion {
  id: string;
  screenerId: string;
  position: number;
  questionText: string;
  source: ScreenerQuestionSource;
  isLocked: boolean;
  /** True when the user edited this screener copy (library row unchanged). */
  isCustomized: boolean;
  libraryQuestionId: string | null;
  questionType: QuestionLibraryType | null;
  answerOptions: QuestionAnswerOption[];
  /** Routing / criteria notes (screener copy; library unchanged). */
  notes: string | null;
  quotaConfig: ScreenerQuestionQuotaConfig | null;
  createdAt: string;
  updatedAt: string;
}

export type DbScreenerQuestionRow = {
  id: string;
  screener_id: string;
  position: number;
  question_text: string;
  source: ScreenerQuestionSource;
  is_locked: boolean;
  is_customized?: boolean;
  library_question_id: string | null;
  question_type: QuestionLibraryType | null;
  answer_options: QuestionAnswerOption[] | null;
  notes?: string | null;
  quota_config?: unknown;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS =
  "id, screener_id, position, question_text, source, is_locked, is_customized, library_question_id, question_type, answer_options, notes, quota_config, created_at, updated_at";

export const SCREENER_QUESTION_SELECT = SELECT_COLUMNS;

export function mapScreenerQuestion(row: DbScreenerQuestionRow): ScreenerQuestion {
  return {
    id: row.id,
    screenerId: row.screener_id,
    position: row.position,
    questionText: row.question_text,
    source: row.source,
    isLocked: row.is_locked,
    isCustomized: row.is_customized ?? false,
    libraryQuestionId: row.library_question_id,
    questionType: row.question_type,
    answerOptions: Array.isArray(row.answer_options) ? row.answer_options : [],
    notes: row.notes ?? null,
    quotaConfig: row.quota_config
      ? normalizeQuotaConfig(
          row.quota_config,
          Array.isArray(row.answer_options) ? row.answer_options.length : 0,
        )
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function questionLabel(position: number): string {
  return `Q${position}`;
}
