"use client";

import type { QuestionAnswerOption } from "@/lib/question-library/types";
import { cn } from "@/lib/utils";

export function AnswerOptionsTable({
  options,
  className,
  showLogicColumns = false,
}: {
  options: QuestionAnswerOption[];
  className?: string;
  /** Show logic note column when any option has a logic note. */
  showLogicColumns?: boolean;
}) {
  if (options.length === 0) return null;

  const hasLogicNote =
    showLogicColumns && options.some((o) => o.logicNote?.trim());

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border/80 bg-[hsl(var(--workspace-surface))]",
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-border/80 bg-muted/40">
            <th className="px-2.5 py-1.5 font-semibold text-muted-foreground">
              Option
            </th>
            {hasLogicNote ? (
              <th className="w-[40%] px-2.5 py-1.5 font-semibold text-muted-foreground">
                Logic note
              </th>
            ) : null}
            <th className="w-24 px-2.5 py-1.5 text-right font-semibold text-muted-foreground">
              Criteria
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((option, index) => (
            <tr
              key={`${index}-${option.text.slice(0, 12)}`}
              className="border-b border-border/60 last:border-b-0"
            >
              <td className="px-2.5 py-2 font-medium text-foreground">
                {option.text}
              </td>
              {hasLogicNote ? (
                <td className="px-2.5 py-2 text-muted-foreground">
                  {option.logicNote?.trim() || "—"}
                </td>
              ) : null}
              <td className="px-2.5 py-2 text-right">
                {option.terminate ? (
                  <span className="font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Terminate
                  </span>
                ) : (
                  <span className="text-muted-foreground/70">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
