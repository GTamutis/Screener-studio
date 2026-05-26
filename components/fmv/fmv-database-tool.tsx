"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

import { createFmvEntry } from "@/app/actions/fmv";
import { FmvProrationPanel } from "@/components/fmv/fmv-proration-panel";
import type { FmvDatabaseStats, FmvEntry } from "@/lib/fmv/types";
import { FMV_COMMON_CURRENCIES } from "@/lib/fmv/currencies";
import { localCalendarIsoDate } from "@/lib/fmv/local-date";

import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { SingleMarketPicker } from "@/components/projects/single-market-picker";
import { cn } from "@/lib/utils";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

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

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </GlassCard>
  );
}

function resolveCurrencyCode(selectValue: string, otherRaw: string) {
  const other = otherRaw.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(other)) return other;
  return selectValue.trim().toUpperCase();
}

export function FmvDatabaseTool({
  entries,
  stats,
}: {
  entries: FmvEntry[];
  stats: FmvDatabaseStats;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [clientName, setClientName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [projectTarget, setProjectTarget] = React.useState("");
  const [methodology, setMethodology] = React.useState("");
  const [currencySelect, setCurrencySelect] = React.useState<string>(
    FMV_COMMON_CURRENCIES[0]?.code ?? "USD",
  );
  const [currencyOther, setCurrencyOther] = React.useState("");
  const [hourlyRate, setHourlyRate] = React.useState("");
  const [effectiveDate, setEffectiveDate] = React.useState(() =>
    localCalendarIsoDate(),
  );
  const [clientLocalToday, setClientLocalToday] = React.useState(() =>
    localCalendarIsoDate(),
  );

  const [query, setQuery] = React.useState("");
  const [countryFilter, setCountryFilter] = React.useState<string>("__all__");
  const [currencyFilter, setCurrencyFilter] = React.useState<string>("__all__");

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [minutes, setMinutes] = React.useState("");

  const countryOptions = React.useMemo(() => {
    const set = new Set(entries.map((e) => e.country.trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const currencyOptions = React.useMemo(() => {
    const set = new Set(entries.map((e) => e.currencyCode.toUpperCase()));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (countryFilter !== "__all__" && e.country !== countryFilter) {
        return false;
      }
      if (
        currencyFilter !== "__all__" &&
        e.currencyCode.toUpperCase() !== currencyFilter
      ) {
        return false;
      }
      if (!q) return true;
      const hay = [
        e.clientName,
        e.projectTarget,
        e.methodology ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query, countryFilter, currencyFilter]);

  React.useEffect(() => {
    if (selectedId && !filtered.some((e) => e.id === selectedId)) {
      setSelectedId(null);
      setMinutes("");
    }
  }, [filtered, selectedId]);

  const minutesNum = Number.parseFloat(minutes);
  const minutesValid = Number.isFinite(minutesNum) && minutesNum >= 0;
  const factor = minutesValid ? minutesNum / 60 : 0;

  function resetForm() {
    setClientName("");
    setCountry("");
    setProjectTarget("");
    setMethodology("");
    setCurrencySelect(FMV_COMMON_CURRENCIES[0]?.code ?? "USD");
    setCurrencyOther("");
    setHourlyRate("");
    setEffectiveDate(localCalendarIsoDate());
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const rate = Number.parseFloat(hourlyRate);
    const currencyCode = resolveCurrencyCode(currencySelect, currencyOther);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error("Enter a valid hourly rate greater than zero.");
      return;
    }
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      toast.error("Pick a currency or enter a 3-letter ISO code.");
      return;
    }

    if (!country.trim()) {
      toast.error("Select a country from the list.");
      return;
    }

    startTransition(async () => {
      const result = await createFmvEntry({
        clientName,
        country,
        projectTarget,
        methodology,
        currencyCode,
        hourlyRateLocal: rate,
        effectiveDate,
        clientLocalToday: localCalendarIsoDate(),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("FMV entry saved with FX for the selected rate date.");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    });
  }

  const selected = entries.find((e) => e.id === selectedId) ?? null;

  function clearSelection() {
    setSelectedId(null);
    setMinutes("");
  }

  return (
    <div className="flex w-full max-w-[1400px] flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
      <div className="min-w-0 flex-1 space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Fair Market Values"
        description="Record client project hourly rates in local currency; we convert to USD, GBP, and EUR using ECB rates for the rate date you choose. Search history, filter by country or currency, and prorate a selected row by minutes."
        actions={
          <Dialog
            open={dialogOpen}
            onOpenChange={(next) => {
              setDialogOpen(next);
              if (next) {
                const today = localCalendarIsoDate();
                setClientLocalToday(today);
                setEffectiveDate(today);
              } else {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" className="gap-2">
                <Plus className="h-4 w-4" />
                New FMV entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add FMV entry</DialogTitle>
                <DialogDescription>
                  Pick the rate date for FX conversion (ECB rates via Frankfurter;
                  weekends use the nearest prior working day).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onCreate} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fmv-client">Client name</Label>
                  <Input
                    id="fmv-client"
                    value={clientName}
                    onChange={(ev) => setClientName(ev.target.value)}
                    required
                    autoComplete="organization"
                  />
                </div>
                <SingleMarketPicker
                  id="fmv-country"
                  value={country ? country : null}
                  onChange={(next) => setCountry(next ?? "")}
                  disabled={pending}
                />
                <div className="grid gap-2">
                  <Label htmlFor="fmv-target">Project target</Label>
                  <Input
                    id="fmv-target"
                    value={projectTarget}
                    onChange={(ev) => setProjectTarget(ev.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fmv-method">Methodology (optional)</Label>
                  <Textarea
                    id="fmv-method"
                    value={methodology}
                    onChange={(ev) => setMethodology(ev.target.value)}
                    rows={3}
                    placeholder="e.g. CATI, CAWI, mixed-mode…"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  <div className="grid gap-2">
                    <Label>Local currency</Label>
                    <FilterSelect
                      className="w-full"
                      value={currencySelect}
                      onValueChange={setCurrencySelect}
                      aria-label="Local currency"
                      options={FMV_COMMON_CURRENCIES.map((c) => ({
                        value: c.code,
                        label: c.label,
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fmv-ccy-other">Other ISO code (optional)</Label>
                    <Input
                      id="fmv-ccy-other"
                      value={currencyOther}
                      onChange={(ev) =>
                        setCurrencyOther(ev.target.value.toUpperCase())
                      }
                      placeholder="Overrides dropdown if 3 letters"
                      maxLength={3}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="fmv-rate">Hourly rate (local)</Label>
                    <Input
                      id="fmv-rate"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      required
                      value={hourlyRate}
                      onChange={(ev) => setHourlyRate(ev.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fmv-effective-date">Rate date</Label>
                    <Input
                      id="fmv-effective-date"
                      type="date"
                      required
                      max={clientLocalToday}
                      value={effectiveDate}
                      onChange={(ev) => setEffectiveDate(ev.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Defaults to today in your timezone (
                      {clientLocalToday}).
                    </p>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Saving…" : "Save & convert"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total entries" value={stats.totalEntries} />
        <StatTile label="Unique countries" value={stats.uniqueCountries} />
        <StatTile label="Unique currencies" value={stats.uniqueCurrencies} />
        <StatTile
          label="Avg hourly rate (USD)"
          value={
            stats.avgHourlyUsd == null ? (
              "—"
            ) : (
              formatMoney(stats.avgHourlyUsd, "USD")
            )
          }
          hint="Mean across all saved entries"
        />
      </section>

      <GlassCard className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="fmv-search">Keyword search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fmv-search"
                  value={query}
                  onChange={(ev) => setQuery(ev.target.value)}
                  placeholder="Client, target, methodology…"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Country</Label>
              <FilterSelect
                className="w-full"
                value={countryFilter}
                onValueChange={setCountryFilter}
                aria-label="Filter by country"
                options={[
                  { value: "__all__", label: "All countries" },
                  ...countryOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <FilterSelect
                className="w-full"
                value={currencyFilter}
                onValueChange={setCurrencyFilter}
                aria-label="Filter by currency"
                options={[
                  { value: "__all__", label: "All currencies" },
                  ...currencyOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/30">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Country</th>
                <th className="px-3 py-3 font-semibold">Target</th>
                <th className="px-3 py-3 font-semibold">Methodology</th>
                <th className="px-3 py-3 font-semibold">Local / h</th>
                <th className="px-3 py-3 font-semibold">USD / h</th>
                <th className="px-3 py-3 font-semibold">GBP / h</th>
                <th className="px-3 py-3 font-semibold">EUR / h</th>
                <th className="px-3 py-3 font-semibold">Rate date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    No entries match your filters yet.
                  </td>
                </tr>
              ) : (
                filtered.flatMap((row) => {
                  const isSel = row.id === selectedId;
                  const showProration =
                    isSel && minutesValid && minutesNum > 0 && factor > 0;

                  const main = (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelectedId(row.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40",
                        isSel && "bg-brand-gradient-soft/80 ring-1 ring-inset ring-primary/25",
                      )}
                    >
                      <td className="px-3 py-3 font-medium text-foreground">
                        {row.clientName}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {row.country}
                      </td>
                      <td className="px-3 py-3">{row.projectTarget}</td>
                      <td className="max-w-[200px] truncate px-3 py-3 text-muted-foreground">
                        {row.methodology ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                        {formatHourlyCompact(
                          row.hourlyRateLocal,
                          row.currencyCode,
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                        {formatHourlyCompact(row.hourlyRateUsd, "USD")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                        {formatHourlyCompact(row.hourlyRateGbp, "GBP")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                        {formatHourlyCompact(row.hourlyRateEur, "EUR")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                        <span className="block font-medium text-foreground">
                          {row.effectiveDate}
                        </span>
                        {row.fxRateDate !== row.effectiveDate ? (
                          <span className="block text-[10px]">
                            ECB {row.fxRateDate}
                          </span>
                        ) : null}
                        <span className="block text-[10px]">
                          Added{" "}
                          {new Date(row.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  );

                  const sub = showProration ? (
                    <tr
                      key={`${row.id}-proration`}
                      className="border-b border-border/40 bg-muted/25"
                    >
                      <td colSpan={9} className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                          <span className="font-semibold text-foreground">
                            Prorated ({minutesNum} min)
                          </span>
                          <span className="text-muted-foreground">
                            Local{" "}
                            <span className="font-mono font-medium text-foreground">
                              {formatMoney(
                                row.hourlyRateLocal * factor,
                                row.currencyCode,
                              )}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            USD{" "}
                            <span className="font-mono font-medium text-foreground">
                              {formatMoney(row.hourlyRateUsd * factor, "USD")}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            GBP{" "}
                            <span className="font-mono font-medium text-foreground">
                              {formatMoney(row.hourlyRateGbp * factor, "GBP")}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            EUR{" "}
                            <span className="font-mono font-medium text-foreground">
                              {formatMoney(row.hourlyRateEur * factor, "EUR")}
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : null;

                  return sub ? [main, sub] : [main];
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      </div>

      <FmvProrationPanel
        className="xl:sticky xl:top-8 xl:max-h-[calc(100dvh-4rem)] xl:overflow-y-auto"
        selected={selected}
        minutes={minutes}
        onMinutesChange={setMinutes}
        onClearSelection={clearSelection}
        minutesValid={minutesValid}
        minutesNum={minutesNum}
      />
    </div>
  );
}
