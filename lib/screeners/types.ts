export type ScreenerStatus = "draft" | "final";

export interface ScreenerSummary {
  id: string;
  projectId: string;
  name: string;
  status: ScreenerStatus;
  majorVersion: number;
  minorVersion: number;
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

export interface RecentScreenerSummary {
  id: string;
  name: string;
  status: ScreenerStatus;
  majorVersion: number;
  minorVersion: number;
  clientName: string;
  projectName: string;
  projectNumber: string;
  ownerDisplayName: string;
  updatedAt: string;
}
