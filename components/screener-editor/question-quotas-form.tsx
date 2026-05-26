"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  countQuotaOptions,
  emptyQuotaConfig,
  type ScreenerQuestionQuotaConfig,
} from "@/lib/screeners/question-quotas";
import type { QuestionOptionFormRow } from "@/lib/screeners/manual-question";

export function QuestionQuotasForm({
  markets,
  answerOptions,
  quotaConfig,
  onQuotaConfigChange,
  disabled,
}: {
  markets: string[];
  answerOptions: QuestionOptionFormRow[];
  quotaConfig: ScreenerQuestionQuotaConfig;
  onQuotaConfigChange: (config: ScreenerQuestionQuotaConfig) => void;
  disabled?: boolean;
}) {
  const filledOptions = answerOptions
    .map((opt, index) => ({ ...opt, index }))
    .filter((opt) => opt.text.trim().length > 0);

  const optionCount = countQuotaOptions(answerOptions);
  const canQuota = optionCount >= 2 && markets.length > 0;

  if (optionCount < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Quotas apply to single- or multi-select questions with at least two
        answer options. Add options on the Question tab first.
      </p>
    );
  }

  if (markets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This project has no markets yet. Add markets on the project to set
        per-market sample targets.
      </p>
    );
  }

  const setEnabled = (enabled: boolean) => {
    if (enabled && quotaConfig.optionTargets.length !== optionCount) {
      onQuotaConfigChange({
        enabled: true,
        optionTargets: emptyQuotaConfig(optionCount).optionTargets,
      });
      return;
    }
    onQuotaConfigChange({ ...quotaConfig, enabled });
  };

  const setMarketTarget = (
    optionIndex: number,
    market: string,
    raw: string,
  ) => {
    const parsed = raw.trim() === "" ? NaN : Number.parseInt(raw, 10);
    const value = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const optionTargets = quotaConfig.optionTargets.map((row, i) => {
      if (i !== optionIndex) return row;
      const next = { ...row };
      if (value > 0) {
        next[market] = value;
      } else {
        delete next[market];
      }
      return next;
    });
    onQuotaConfigChange({ ...quotaConfig, optionTargets });
  };

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-border dark:bg-muted/20">
        <Checkbox
          checked={quotaConfig.enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
          disabled={disabled || !canQuota}
          className="mt-0.5"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">
            Apply quotas on this question
          </span>
          <span className="block text-xs text-muted-foreground">
            Set how many completes you need per answer option in each market.
          </span>
        </span>
      </label>

      {quotaConfig.enabled ? (
        <div className="space-y-4">
          {filledOptions.map((option, displayIndex) => {
            const targetIndex = displayIndex;
            const row = quotaConfig.optionTargets[targetIndex] ?? {};

            return (
              <fieldset
                key={option.index}
                className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-border"
              >
                <legend className="px-1 text-xs font-semibold text-foreground">
                  {option.text.trim() || `Option ${displayIndex + 1}`}
                </legend>
                <ul className="space-y-2">
                  {markets.map((market) => (
                    <li
                      key={market}
                      className="flex items-center justify-between gap-3"
                    >
                      <Label
                        htmlFor={`quota-${option.index}-${market}`}
                        className="shrink-0 text-xs font-normal text-muted-foreground"
                      >
                        {market}
                      </Label>
                      <Input
                        id={`quota-${option.index}-${market}`}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={row[market] ?? ""}
                        onChange={(e) =>
                          setMarketTarget(
                            targetIndex,
                            market,
                            e.target.value,
                          )
                        }
                        disabled={disabled}
                        className="h-8 w-24 text-right text-sm tabular-nums"
                      />
                    </li>
                  ))}
                </ul>
              </fieldset>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
