import type { ScreenerStatus } from "@/lib/screeners/types";

export type ScreenerDisplayStatus = "draft" | "final";

/** User-facing draft vs final labels for dashboard tables. */
export function screenerToDisplayStatus(
  status: ScreenerStatus,
): ScreenerDisplayStatus {
  return status === "published" || status === "archived" ? "final" : "draft";
}

export function screenerDisplayStatusLabel(
  status: ScreenerDisplayStatus,
): string {
  return status === "final" ? "Final" : "Draft";
}
