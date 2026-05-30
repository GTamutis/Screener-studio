import type {
  StakeholderReviewPersona,
  StakeholderReviewSeverity,
} from "@/lib/screeners/stakeholder-review/constants";

export type StakeholderReviewFeedbackItem = {
  question_position: number | null;
  severity: StakeholderReviewSeverity;
  feedback_text: string;
};

export type StakeholderReviewModelResponse = Record<
  StakeholderReviewPersona,
  StakeholderReviewFeedbackItem[]
>;

export type StakeholderReviewInsertRow = {
  screener_id: string;
  persona: StakeholderReviewPersona;
  question_id: string | null;
  severity: StakeholderReviewSeverity;
  feedback_text: string;
};
