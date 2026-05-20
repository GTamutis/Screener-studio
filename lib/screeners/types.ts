export type ScreenerStatus = "draft" | "in_progress" | "published" | "archived";

export interface ScreenerSummary {
  id: string;
  projectId: string;
  name: string;
  status: ScreenerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenerWithProject extends ScreenerSummary {
  clientName: string;
  projectName: string;
  projectNumber: string;
}
