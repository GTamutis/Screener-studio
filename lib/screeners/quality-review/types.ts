export type QualityReviewSeverity = "error" | "warning" | "info";

export type QualityReviewIssue = {
  id: string;
  question_number: number | null;
  severity: QualityReviewSeverity;
  issue_type: string;
  description: string;
  suggestion: string;
};

export type QualityReviewResult = {
  issues: QualityReviewIssue[];
  overall_comment: string;
  estimated_loi_minutes: number;
};

export type DismissedQualityReviewIssue = {
  issueId: string;
  reason: string;
  dismissedAt: string;
};
