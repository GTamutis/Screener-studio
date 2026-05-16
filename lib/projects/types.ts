export interface ProjectSummary {
  id: string;
  clientName: string;
  projectNumber: string;
  projectName: string;
  markets: string[];
  createdAt: string;
}

/** Full project row; same shape as summary today — extend here when the DB gains extra fields. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional extension point vs ProjectSummary
export interface Project extends ProjectSummary {}
