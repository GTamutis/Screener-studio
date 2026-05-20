import type { BadgeProps } from "@/components/ui/badge";
import type { ScreenerStatus } from "@/lib/screeners/types";

const STATUS_LABEL: Record<ScreenerStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  published: "Published",
  archived: "Archived",
};

const STATUS_VARIANT: Record<ScreenerStatus, NonNullable<BadgeProps["variant"]>> =
  {
    draft: "outline",
    in_progress: "info",
    published: "success",
    archived: "secondary",
  };

export function screenerStatusLabel(status: ScreenerStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function screenerStatusBadgeVariant(
  status: ScreenerStatus,
): NonNullable<BadgeProps["variant"]> {
  return STATUS_VARIANT[status] ?? "outline";
}
