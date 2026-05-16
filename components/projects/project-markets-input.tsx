"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { INVITELY_MARKETS } from "@/lib/invitely/countries";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ProjectMarketsInput({
  id = "project-markets-input",
  label = "Markets",
  hint = "Type to search, then pick a market. Remove with ×.",
  value,
  onChange,
  disabled = false,
}: {
  id?: string;
  label?: string;
  hint?: string;
  value: string[];
  onChange: (markets: string[]) => void;
  disabled?: boolean;
}) {
  const [marketQuery, setMarketQuery] = useState("");
  const [marketsFocused, setMarketsFocused] = useState(false);

  const selected = useMemo(() => new Set(value), [value]);

  const filteredMarkets = useMemo(() => {
    const q = marketQuery.trim().toLowerCase();
    return INVITELY_MARKETS.filter(
      (m) =>
        !selected.has(m) &&
        (q.length === 0 || m.toLowerCase().includes(q)),
    );
  }, [marketQuery, selected]);

  const addMarket = (labelMarket: string) => {
    if (disabled) return;
    if (value.includes(labelMarket)) return;
    onChange([...value, labelMarket]);
    setMarketQuery("");
  };

  const removeMarket = (labelMarket: string) => {
    if (disabled) return;
    onChange(value.filter((m) => m !== labelMarket));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <div className="space-y-1.5">
        <div
          className={cn(
            "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border/50 bg-background/80 px-2 py-1.5 ring-1 ring-inset ring-white/10 transition-[box-shadow]",
            marketsFocused &&
              !disabled &&
              "border-primary/35 ring-primary/15 shadow-sm",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          {value.map((m) => (
            <span
              key={m}
              className="inline-flex max-w-full items-center gap-0.5 rounded-full bg-primary/12 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
            >
              <span className="truncate">{m}</span>
              <button
                type="button"
                onClick={() => removeMarket(m)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-primary/80 transition hover:bg-primary/15 hover:text-primary"
                aria-label={`Remove ${m}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            id={id}
            type="text"
            autoComplete="off"
            disabled={disabled}
            placeholder={
              value.length === 0 ? "Add markets…" : "Add more…"
            }
            value={marketQuery}
            onChange={(e) => setMarketQuery(e.target.value)}
            onFocus={() => setMarketsFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setMarketsFocused(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && marketQuery === "") {
                if (value.length > 0) {
                  e.preventDefault();
                  removeMarket(value[value.length - 1]);
                }
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const first = filteredMarkets[0];
                if (first) addMarket(first);
              }
            }}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
        {marketsFocused && !disabled && filteredMarkets.length > 0 ? (
          <ul
            className="max-h-40 overflow-y-auto rounded-xl border border-border/40 bg-popover/95 shadow-md ring-1 ring-inset ring-border/30 backdrop-blur-sm"
            role="listbox"
            aria-label="Market suggestions"
          >
            {filteredMarkets.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex w-full px-3 py-2 text-left text-sm text-foreground transition hover:bg-brand-gradient-soft/60"
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    addMarket(m);
                  }}
                >
                  {m}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {marketsFocused &&
        !disabled &&
        marketQuery.trim().length > 0 &&
        filteredMarkets.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            No matches. Try another spelling.
          </p>
        ) : null}
      </div>
    </div>
  );
}
