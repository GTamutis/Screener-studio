import { Badge } from "@/components/ui/badge";
import {
  screenerStatusBadgeVariant,
  screenerStatusLabel,
} from "@/lib/screeners/status-labels";
import type { ScreenerStatus } from "@/lib/screeners/types";

export function ScreenerStatusBadge({ status }: { status: ScreenerStatus }) {
  return (
    <Badge variant={screenerStatusBadgeVariant(status)}>
      {screenerStatusLabel(status)}
    </Badge>
  );
}
