/**
 * Bulk import FMV rows from public/templates/fmv-import-template.csv
 * Usage: node scripts/import-fmv-from-csv.mjs [path-to-csv]
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultCsv = join(root, "public/templates/fmv-import-template.csv");

const MAJOR = ["USD", "GBP", "EUR"];

/** Spreadsheet shorthand → workspace country picker label */
const COUNTRY_ALIASES = {
  USA: "United States",
  UK: "United Kingdom",
  UAE: "United Arab Emirates",
};

const ALLOWED_COUNTRIES = new Set([
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Czech Republic",
  "Denmark",
  "Finland",
  "France",
  "Germany",
  "Hong Kong",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Philippines",
  "Poland",
  "Portugal",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
]);

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function roundMoney(value) {
  return Math.round(value * 1e6) / 1e6;
}

function frankfurterUrl(rateDate) {
  const segment = rateDate?.trim() ? rateDate.trim() : "latest";
  return `https://api.frankfurter.app/${segment}`;
}

async function fetchFrankfurter(from, toCsv, rateDate) {
  const qs = new URLSearchParams({ from, to: toCsv });
  const url = `${frankfurterUrl(rateDate)}?${qs.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `FX ${from} @ ${rateDate}: ${body.slice(0, 120) || res.statusText}`,
    );
  }
  return res.json();
}

async function hourlyLocalToUsdGbpEur(hourlyLocal, currencyCode, rateDate) {
  const code = currencyCode.trim().toUpperCase();

  // Frankfurter has no AED; UAE dirham uses USD peg (3.6725), then ECB crosses.
  if (code === "AED") {
    const AED_PER_USD = 3.6725;
    const hourlyUsd = roundMoney(hourlyLocal / AED_PER_USD);
    const data = await fetchFrankfurter("USD", "EUR,GBP", rateDate);
    return {
      hourlyUsd,
      hourlyGbp: roundMoney(hourlyUsd * data.rates.GBP),
      hourlyEur: roundMoney(hourlyUsd * data.rates.EUR),
      fxRateDate: data.date,
    };
  }

  const isMajor = MAJOR.includes(code);

  if (isMajor) {
    const others = MAJOR.filter((c) => c !== code);
    const data = await fetchFrankfurter(code, others.join(","), rateDate);
    let hourlyUsd = 0;
    let hourlyGbp = 0;
    let hourlyEur = 0;
    if (code === "USD") {
      hourlyUsd = hourlyLocal;
      hourlyGbp = roundMoney(hourlyLocal * data.rates.GBP);
      hourlyEur = roundMoney(hourlyLocal * data.rates.EUR);
    } else if (code === "GBP") {
      hourlyGbp = hourlyLocal;
      hourlyUsd = roundMoney(hourlyLocal * data.rates.USD);
      hourlyEur = roundMoney(hourlyLocal * data.rates.EUR);
    } else {
      hourlyEur = hourlyLocal;
      hourlyUsd = roundMoney(hourlyLocal * data.rates.USD);
      hourlyGbp = roundMoney(hourlyLocal * data.rates.GBP);
    }
    return {
      hourlyUsd: roundMoney(hourlyUsd),
      hourlyGbp: roundMoney(hourlyGbp),
      hourlyEur: roundMoney(hourlyEur),
      fxRateDate: data.date,
    };
  }

  const data = await fetchFrankfurter(code, "USD,GBP,EUR", rateDate);
  return {
    hourlyUsd: roundMoney(hourlyLocal * data.rates.USD),
    hourlyGbp: roundMoney(hourlyLocal * data.rates.GBP),
    hourlyEur: roundMoney(hourlyLocal * data.rates.EUR),
    fxRateDate: data.date,
  };
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function normalizeCountry(raw) {
  const t = raw.trim();
  return COUNTRY_ALIASES[t] ?? COUNTRY_ALIASES[t.toUpperCase()] ?? t;
}

loadEnvLocal();

const csvPath = process.argv[2] ? join(process.cwd(), process.argv[2]) : defaultCsv;
if (!existsSync(csvPath)) {
  console.error("CSV not found:", csvPath);
  process.exit(1);
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: users, error: userErr } = await supabase
  .from("app_users")
  .select("clerk_user_id, email, role, status")
  .eq("status", "active")
  .not("clerk_user_id", "is", null)
  .order("role", { ascending: true });

if (userErr || !users?.length) {
  console.error("No active app users with clerk_user_id:", userErr?.message);
  process.exit(1);
}

const owner =
  users.find((u) => u.role === "admin") ?? users[0];
const clerkUserId = owner.clerk_user_id;
console.log(`Importing as ${owner.email} (${clerkUserId})`);

const rows = parseCsv(readFileSync(csvPath, "utf8"));
console.log(`Found ${rows.length} data rows in ${csvPath}`);

let ok = 0;
let fail = 0;

for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const line = i + 2;
  const clientName = r.client_name?.trim();
  const country = normalizeCountry(r.country ?? "");
  const projectTarget = r.project_target?.trim();
  const methodology = r.methodology?.trim() || null;
  const currencyCode = (r.currency_code ?? "").trim().toUpperCase();
  const hourlyRateLocal = Number.parseFloat(r.hourly_rate_local);
  const effectiveDate = (r.effective_date ?? "").trim();

  if (!clientName || !country || !projectTarget || !currencyCode || !effectiveDate) {
    console.error(`Line ${line}: missing required field`);
    fail++;
    continue;
  }
  if (!ALLOWED_COUNTRIES.has(country)) {
    console.error(`Line ${line}: unknown country "${r.country}" → "${country}"`);
    fail++;
    continue;
  }
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    console.error(`Line ${line}: invalid currency ${currencyCode}`);
    fail++;
    continue;
  }
  if (!Number.isFinite(hourlyRateLocal) || hourlyRateLocal <= 0) {
    console.error(`Line ${line}: invalid rate ${r.hourly_rate_local}`);
    fail++;
    continue;
  }

  try {
    const converted = await hourlyLocalToUsdGbpEur(
      hourlyRateLocal,
      currencyCode,
      effectiveDate,
    );

    const { error } = await supabase.from("fmv_entries").insert({
      clerk_user_id: clerkUserId,
      client_name: clientName,
      country,
      project_target: projectTarget,
      methodology,
      currency_code: currencyCode,
      hourly_rate_local: hourlyRateLocal,
      hourly_rate_usd: converted.hourlyUsd,
      hourly_rate_gbp: converted.hourlyGbp,
      hourly_rate_eur: converted.hourlyEur,
      effective_date: effectiveDate,
      fx_rate_date: converted.fxRateDate,
    });

    if (error) throw new Error(error.message);

    ok++;
    console.log(
      `  ✓ ${clientName} · ${country} · ${projectTarget} (${currencyCode} ${hourlyRateLocal})`,
    );
  } catch (e) {
    fail++;
    console.error(
      `Line ${line}: ${clientName} / ${country} / ${projectTarget} — ${e instanceof Error ? e.message : e}`,
    );
  }
}

console.log(`\nImport finished: ${ok} saved, ${fail} failed.`);
