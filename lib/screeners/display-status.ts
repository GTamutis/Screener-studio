import type { ScreenerStatus } from "@/lib/screeners/types";

export type ScreenerDisplayStatus = ScreenerStatus;

export function screenerToDisplayStatus(status: ScreenerStatus): ScreenerDisplayStatus {
  return status;
}

export function screenerDisplayStatusLabel(
  status: ScreenerDisplayStatus,
): string {
  return status === "final" ? "Final" : "Draft";
}
