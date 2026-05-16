"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  INVITELY_MARKETS,
  type InvitelyMarketLabel,
  getInvitelyMarketIso2,
} from "@/lib/invitely/countries";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SingleMarketPicker({
  id = "single-market-picker",
  label = "Country",
  hint = "Same list as Projects — type to filter, pick a row to set name and ISO code.",
  value,
  onChange,
  disabled = false,
}: {
  id?: string;
  label?: string;
  hint?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const filteredMarkets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INVITELY_MARKETS.filter((m) => {
      if (value != null && m === value) return false;
      if (value != null && q.length === 0) return false;
      return q.length === 0 || m.toLowerCase().includes(q);
    });
  }, [query, value]);

  const pick = (market: InvitelyMarketLabel) => {
    if (disabled) return;
    onChange(market);
    setQuery("");
  };

  const clear = () => {
    if (disabled) return;
    onChange(null);
    setQuery("");
  };

  const selectedIso = value ? getInvitelyMarketIso2(value) : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <div className="space-y-1.5">
        <div
          className={cn(
            "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border/50 bg-background/80 px-2 py-1.5 ring-1 ring-inset ring-white/10 transition-[box-shadow]",
            focused && !disabled && "border-primary/35 ring-primary/15 shadow-sm",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          {value ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/12 py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              <span className="min-w-0 truncate">{value}</span>
              {selectedIso ? (
                <span className="shrink-0 rounded-md bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary/90 ring-1 ring-inset ring-primary/15">
                  {selectedIso}
                </span>
              ) : null}
              <button
                type="button"
                onClick={clear}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-primary/80 transition hover:bg-primary/15 hover:text-primary"
                aria-label={`Clear ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}
          <input
            id={id}
            type="text"
            autoComplete="off"
            disabled={disabled}
            placeholder={
              value == null ? "Search countries…" : "Type to change country…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && query === "") {
                if (value != null) {
                  e.preventDefault();
                  clear();
                }
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const first = filteredMarkets[0];
                if (first) pick(first);
              }
            }}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
        {focused && !disabled && filteredMarkets.length > 0 ? (
          <ul
            className="max-h-40 overflow-y-auto rounded-xl border border-border/40 bg-popover/95 shadow-md ring-1 ring-inset ring-border/30 backdrop-blur-sm"
            role="listbox"
            aria-label="Country suggestions"
          >
            {filteredMarkets.map((m) => {
              const code = getInvitelyMarketIso2(m);
              return (
                <li key={m}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition hover:bg-brand-gradient-soft/60"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      pick(m);
                    }}
                  >
                    <span className="min-w-0 truncate">{m}</span>
                    {code ? (
                      <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {code}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {focused &&
        !disabled &&
        query.trim().length > 0 &&
        filteredMarkets.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            No matches. Try another spelling.
          </p>
        ) : null}
      </div>
    </div>
  );
}
