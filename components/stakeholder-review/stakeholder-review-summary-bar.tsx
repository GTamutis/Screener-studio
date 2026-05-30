"use client";

import type { PersonaIssueCounts } from "@/lib/screeners/stakeholder-review/matrix";
import {
  STAKEHOLDER_MATRIX_PERSONAS,
  type StakeholderReviewPersona,
} from "@/lib/screeners/stakeholder-review/constants";
import { STAKEHOLDER_PERSONA_LABELS } from "@/lib/screeners/stakeholder-review/display";

export function StakeholderReviewSummaryBar({
  counts,
}: {
  counts: Record<StakeholderReviewPersona, PersonaIssueCounts>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STAKEHOLDER_MATRIX_PERSONAS.map((persona) => {
        const { red, amber } = counts[persona];
        return (
          <div key={persona} className="sr-summary-card rounded-lg px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {STAKEHOLDER_PERSONA_LABELS[persona]}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              <span className="text-red-600 dark:text-red-400">{red} red</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-amber-700 dark:text-amber-400">
                {amber} amber
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
