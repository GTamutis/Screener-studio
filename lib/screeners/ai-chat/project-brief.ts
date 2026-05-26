import { formatProjectSpecsForAi } from "@/lib/projects/project-specs";
import type { ScreenerWithProject } from "@/lib/screeners/types";

/** Project context sent to the AI chat API (metadata + project specs). */
export function buildProjectBrief(screener: ScreenerWithProject): string {
  return formatProjectSpecsForAi(screener.projectSpecs, {
    clientName: screener.clientName,
    projectName: screener.projectName,
    projectNumber: screener.projectNumber,
    screenerName: screener.name,
    markets: screener.markets,
  });
}
