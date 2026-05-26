import "server-only";

const FRANKFURTER_BASE = "https://api.frankfurter.app";

const MAJOR = ["USD", "GBP", "EUR"] as const;
type Major = (typeof MAJOR)[number];

export type HourlyMajorRates = {
  hourlyUsd: number;
  hourlyGbp: number;
  hourlyEur: number;
  fxRateDate: string;
};

function roundMoney(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

function frankfurterUrl(rateDate: string | undefined) {
  const segment = rateDate?.trim() ? rateDate.trim() : "latest";
  return `${FRANKFURTER_BASE}/${segment}`;
}

async function fetchFrankfurter(
  from: string,
  toCsv: string,
  rateDate?: string,
): Promise<FrankfurterResponse> {
  const qs = new URLSearchParams({ from, to: toCsv });
  const url = `${frankfurterUrl(rateDate)}?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Could not load FX rates for ${from}${rateDate ? ` on ${rateDate}` : ""}. ${body ? body.slice(0, 160) : res.statusText}`,
    );
  }
  return (await res.json()) as FrankfurterResponse;
}

/**
 * Converts an hourly amount in `currencyCode` into USD, GBP, and EUR.
 * When `rateDate` is set (YYYY-MM-DD), uses Frankfurter historical ECB rates for that day
 * (or the nearest prior working day). Otherwise uses latest rates.
 */
export async function hourlyLocalToUsdGbpEur(
  hourlyLocal: number,
  currencyCode: string,
  rateDate?: string,
): Promise<HourlyMajorRates> {
  const code = currencyCode.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error("Currency must be a 3-letter ISO 4217 code.");
  }
  if (!Number.isFinite(hourlyLocal) || hourlyLocal <= 0) {
    throw new Error("Hourly rate must be a positive number.");
  }

  // Frankfurter has no AED; UAE dirham is pegged to USD (CBUAE).
  if (code === "AED") {
    const AED_PER_USD = 3.6725;
    const hourlyUsd = roundMoney(hourlyLocal / AED_PER_USD);
    const data = await fetchFrankfurter("USD", "EUR,GBP", rateDate);
    const hourlyGbp = roundMoney(hourlyUsd * (data.rates.GBP ?? NaN));
    const hourlyEur = roundMoney(hourlyUsd * (data.rates.EUR ?? NaN));
    if (![hourlyUsd, hourlyGbp, hourlyEur].every((n) => Number.isFinite(n) && n > 0)) {
      throw new Error("Incomplete FX rates returned for AED (USD peg + ECB crosses).");
    }
    return {
      hourlyUsd,
      hourlyGbp,
      hourlyEur,
      fxRateDate: data.date,
    };
  }

  const isMajor = (MAJOR as readonly string[]).includes(code);

  if (isMajor) {
    const base = code as Major;
    const others = MAJOR.filter((c) => c !== base);
    const data = await fetchFrankfurter(base, others.join(","), rateDate);

    let hourlyUsd = 0;
    let hourlyGbp = 0;
    let hourlyEur = 0;

    if (base === "USD") {
      hourlyUsd = hourlyLocal;
      hourlyGbp = roundMoney(hourlyLocal * (data.rates.GBP ?? NaN));
      hourlyEur = roundMoney(hourlyLocal * (data.rates.EUR ?? NaN));
    } else if (base === "GBP") {
      hourlyGbp = hourlyLocal;
      hourlyUsd = roundMoney(hourlyLocal * (data.rates.USD ?? NaN));
      hourlyEur = roundMoney(hourlyLocal * (data.rates.EUR ?? NaN));
    } else {
      hourlyEur = hourlyLocal;
      hourlyUsd = roundMoney(hourlyLocal * (data.rates.USD ?? NaN));
      hourlyGbp = roundMoney(hourlyLocal * (data.rates.GBP ?? NaN));
    }

    if (![hourlyUsd, hourlyGbp, hourlyEur].every((n) => Number.isFinite(n) && n > 0)) {
      throw new Error(`Incomplete FX rates returned for ${base}.`);
    }

    return {
      hourlyUsd: roundMoney(hourlyUsd),
      hourlyGbp: roundMoney(hourlyGbp),
      hourlyEur: roundMoney(hourlyEur),
      fxRateDate: data.date,
    };
  }

  const data = await fetchFrankfurter(code, "USD,GBP,EUR", rateDate);
  const hourlyUsd = roundMoney(hourlyLocal * (data.rates.USD ?? NaN));
  const hourlyGbp = roundMoney(hourlyLocal * (data.rates.GBP ?? NaN));
  const hourlyEur = roundMoney(hourlyLocal * (data.rates.EUR ?? NaN));

  if (![hourlyUsd, hourlyGbp, hourlyEur].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error(
      `Frankfurter did not return USD, GBP, and EUR rates for ${code}. Try another currency code.`,
    );
  }

  return {
    hourlyUsd,
    hourlyGbp,
    hourlyEur,
    fxRateDate: data.date,
  };
}
