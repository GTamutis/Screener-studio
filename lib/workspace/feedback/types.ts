export type WorkspaceFeedbackKind = "bug" | "suggestion";

export interface WorkspaceFeedbackEntry {
  id: string;
  kind: WorkspaceFeedbackKind;
  message: string;
  pageUrl: string | null;
  clerkUserId: string;
  userEmail: string;
  userDisplayName: string | null;
  createdAt: string;
}

export type DbWorkspaceFeedbackRow = {
  id: string;
  kind: WorkspaceFeedbackKind;
  message: string;
  page_url: string | null;
  clerk_user_id: string;
  user_email: string;
  user_display_name: string | null;
  created_at: string;
};

export function mapWorkspaceFeedbackRow(
  row: DbWorkspaceFeedbackRow,
): WorkspaceFeedbackEntry {
  return {
    id: row.id,
    kind: row.kind,
    message: row.message,
    pageUrl: row.page_url,
    clerkUserId: row.clerk_user_id,
    userEmail: row.user_email,
    userDisplayName: row.user_display_name,
    createdAt: row.created_at,
  };
}

export const FEEDBACK_KIND_LABELS: Record<WorkspaceFeedbackKind, string> = {
  bug: "Bug report",
  suggestion: "Suggestion",
};

export const FEEDBACK_KIND_DESCRIPTIONS: Record<WorkspaceFeedbackKind, string> = {
  bug: "Something broken or not working as expected.",
  suggestion: "An idea to improve the workspace or add functionality.",
};
