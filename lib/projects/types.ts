import type { ProjectSpecs } from "@/lib/projects/project-specs";

export interface ProjectSummary {
  id: string;
  clientName: string;
  projectNumber: string;
  projectName: string;
  markets: string[];
  createdAt: string;
  ownerClerkUserId: string;
  ownerDisplayName: string;
}

/** Full project row including screener design context for AI and editors. */
export interface Project extends ProjectSummary {
  projectSpecs: ProjectSpecs;
}
