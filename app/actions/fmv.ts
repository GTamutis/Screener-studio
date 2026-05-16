"use server";

import { revalidatePath } from "next/cache";

import { ownerClerkIdFilter } from "@/lib/auth/access";
import { getActiveAppUserForAction } from "@/lib/auth/get-app-user";
import type { FmvDatabaseStats, FmvEntry } from "@/lib/fmv/types";
import { hourlyLocalToUsdGbpEur } from "@/lib/fmv/exchange-rates";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeWhitespace } from "@/lib/invitely/validation";
import { isAllowedInvitelyMarket } from "@/lib/invitely/countries";

type DbFmvRow = {
  id: string;
  clerk_user_id: string;
  client_name: string;
  country: string;
  project_target: string;
  methodology: string | null;
  currency_code: string;
  hourly_rate_local: string | number;
  hourly_rate_usd: string | number;
  hourly_rate_gbp: string | number;
  hourly_rate_eur: string | number;
  fx_rate_date: string;
  created_at: string;
};

function num(v: string | number) {
  return typeof v === "number" ? v : Number.parseFloat(v);
}

function mapRow(row: DbFmvRow): FmvEntry {
  return {
    id: row.id,
    clientName: row.client_name,
    country: row.country,
    projectTarget: row.project_target,
    methodology: row.methodology,
    currencyCode: row.currency_code,
    hourlyRateLocal: num(row.hourly_rate_local),
    hourlyRateUsd: num(row.hourly_rate_usd),
    hourlyRateGbp: num(row.hourly_rate_gbp),
    hourlyRateEur: num(row.hourly_rate_eur),
    fxRateDate: row.fx_rate_date,
    createdAt: row.created_at,
  };
}

function computeStats(entries: FmvEntry[]): FmvDatabaseStats {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      uniqueCountries: 0,
      uniqueCurrencies: 0,
      avgHourlyUsd: null,
    };
  }
  const countries = new Set(entries.map((e) => e.country.trim().toLowerCase()));
  const currencies = new Set(entries.map((e) => e.currencyCode.toUpperCase()));
  const sumUsd = entries.reduce((s, e) => s + e.hourlyRateUsd, 0);
  return {
    totalEntries: entries.length,
    uniqueCountries: countries.size,
    uniqueCurrencies: currencies.size,
    avgHourlyUsd: sumUsd / entries.length,
  };
}

function validateCurrency(code: string) {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) {
    throw new Error("Currency must be a 3-letter ISO 4217 code.");
  }
  return c;
}

export async function listFmvEntries(): Promise<
  { entries: FmvEntry[]; stats: FmvDatabaseStats } | { error: string }
> {
  const appUser = await getActiveAppUserForAction();
  if ("error" in appUser) return { error: appUser.error };

  const supabase = createAdminClient();
  let query = supabase
    .from("fmv_entries")
    .select(
      "id, clerk_user_id, client_name, country, project_target, methodology, currency_code, hourly_rate_local, hourly_rate_usd, hourly_rate_gbp, hourly_rate_eur, fx_rate_date, created_at",
    )
    .order("created_at", { ascending: false });

  const ownerFilter = ownerClerkIdFilter(appUser);
  if (ownerFilter) {
    query = query.eq("clerk_user_id", ownerFilter);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };

  const entries = (data ?? []).map((row) => mapRow(row as DbFmvRow));
  return { entries, stats: computeStats(entries) };
}

export async function createFmvEntry(input: {
  clientName: string;
  country: string;
  projectTarget: string;
  methodology?: string;
  currencyCode: string;
  hourlyRateLocal: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const appUser = await getActiveAppUserForAction();
    if ("error" in appUser) return { ok: false, error: appUser.error };
    const userId = appUser.clerkUserId!;

    const clientName = normalizeWhitespace(input.clientName);
    const country = normalizeWhitespace(input.country);
    const projectTarget = normalizeWhitespace(input.projectTarget);
    const methodologyRaw = normalizeWhitespace(input.methodology ?? "");
    const methodology = methodologyRaw ? methodologyRaw : null;

    if (!clientName) return { ok: false, error: "Client name is required." };
    if (!country) return { ok: false, error: "Country is required." };
    if (!isAllowedInvitelyMarket(country)) {
      return {
        ok: false,
        error: "Pick a country from the workspace list (same as Projects).",
      };
    }
    if (!projectTarget) return { ok: false, error: "Project target is required." };

    let currencyCode: string;
    try {
      currencyCode = validateCurrency(input.currencyCode);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Invalid currency.",
      };
    }

    const hourlyRateLocal = input.hourlyRateLocal;
    if (!Number.isFinite(hourlyRateLocal) || hourlyRateLocal <= 0) {
      return { ok: false, error: "Hourly rate must be a positive number." };
    }

    let converted: Awaited<ReturnType<typeof hourlyLocalToUsdGbpEur>>;
    try {
      converted = await hourlyLocalToUsdGbpEur(hourlyRateLocal, currencyCode);
    } catch (e) {
      return {
        ok: false,
        error:
          e instanceof Error ? e.message : "Could not fetch exchange rates.",
      };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("fmv_entries")
      .insert({
        clerk_user_id: userId,
        client_name: clientName,
        country,
        project_target: projectTarget,
        methodology,
        currency_code: currencyCode,
        hourly_rate_local: hourlyRateLocal,
        hourly_rate_usd: converted.hourlyUsd,
        hourly_rate_gbp: converted.hourlyGbp,
        hourly_rate_eur: converted.hourlyEur,
        fx_rate_date: converted.fxRateDate,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/workspace/fair-market-values");
    return { ok: true, id: data.id as string };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save FMV entry.",
    };
  }
}
