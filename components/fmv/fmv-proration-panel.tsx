"use client";

import { Calculator } from "lucide-react";

import type { FmvEntry } from "@/lib/fmv/types";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatHourlyCompact(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function FmvProrationPanel({
  selected,
  minutes,
  onMinutesChange,
  onClearSelection,
  minutesValid,
  minutesNum,
  className,
}: {
  selected: FmvEntry | null;
  minutes: string;
  onMinutesChange: (value: string) => void;
  onClearSelection: () => void;
  minutesValid: boolean;
  minutesNum: number;
  className?: string;
}) {
  const factor = minutesValid ? minutesNum / 60 : 0;
  const showResult = selected && minutesValid && minutesNum > 0;

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-4 lg:w-[280px]",
        className,
      )}
    >
      <div className={cn(workspaceCardClassName, "p-5")}>
        <h3 className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          <Calculator className="h-3.5 w-3.5" />
          Proration calculator
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Select a row in the table, enter minutes worked, and prorated costs
          appear below that row.
        </p>

        {selected ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-xs">
              <p className="font-medium text-foreground">{selected.clientName}</p>
              <p className="mt-0.5 text-muted-foreground">
                {selected.country} · {selected.projectTarget}
              </p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                {formatHourlyCompact(
                  selected.hourlyRateLocal,
                  selected.currencyCode,
                )}
                /h local · FX {selected.effectiveDate}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fmv-panel-minutes">Minutes</Label>
              <Input
                id="fmv-panel-minutes"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="e.g. 45"
                value={minutes}
                onChange={(ev) => onMinutesChange(ev.target.value)}
              />
            </div>

            {showResult ? (
              <dl className="space-y-2 border-t border-border/60 pt-3 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Local</dt>
                  <dd className="font-mono font-medium text-foreground">
                    {formatHourlyCompact(
                      selected.hourlyRateLocal * factor,
                      selected.currencyCode,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">USD</dt>
                  <dd className="font-mono font-medium text-foreground">
                    {formatHourlyCompact(selected.hourlyRateUsd * factor, "USD")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">GBP</dt>
                  <dd className="font-mono font-medium text-foreground">
                    {formatHourlyCompact(selected.hourlyRateGbp * factor, "GBP")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">EUR</dt>
                  <dd className="font-mono font-medium text-foreground">
                    {formatHourlyCompact(selected.hourlyRateEur * factor, "EUR")}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Enter minutes above to preview prorated amounts.
              </p>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={onClearSelection}
            >
              Clear selection
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            Click a table row to use its hourly rates in the calculator.
          </p>
        )}
      </div>
    </aside>
  );
}
