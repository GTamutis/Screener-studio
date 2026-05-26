export type ScreenerStatus = "draft" | "in_progress" | "published" | "archived";

export interface ScreenerSummary {
  id: string;
  projectId: string;
  name: string;
  status: ScreenerStatus;
  createdAt: string;
  updatedAt: string;
}

import type { ProjectSpecs } from "@/lib/projects/project-specs";

export interface ScreenerWithProject extends ScreenerSummary {
  clientName: string;
  projectName: string;
  projectNumber: string;
  markets: string[];
  projectSpecs: ProjectSpecs;
}
