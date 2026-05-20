import {
  screenerQuestionSourceBadgeClass,
  screenerQuestionSourceLabel,
} from "@/lib/screeners/question-source-labels";
import type { ScreenerQuestionSource } from "@/lib/screeners/question-types";
import { cn } from "@/lib/utils";

export function QuestionSourceBadge({
  source,
  className,
}: {
  source: ScreenerQuestionSource;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        screenerQuestionSourceBadgeClass(source),
        className,
      )}
    >
      {screenerQuestionSourceLabel(source)}
    </span>
  );
}
