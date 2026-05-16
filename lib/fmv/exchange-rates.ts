import "server-only";

const FRANKFURTER_LATEST = "https://api.frankfurter.app/latest";

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

async function fetchFrankfurter(from: string, toCsv: string): Promise<FrankfurterResponse> {
  const qs = new URLSearchParams({ from, to: toCsv });
  const url = `${FRANKFURTER_LATEST}?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Could not load FX rates for ${from}. ${body ? body.slice(0, 160) : res.statusText}`,
    );
  }
  return (await res.json()) as FrankfurterResponse;
}

/**
 * Converts an hourly amount in `currencyCode` into USD, GBP, and EUR using Frankfurter’s latest rates.
 */
export async function hourlyLocalToUsdGbpEur(
  hourlyLocal: number,
  currencyCode: string,
): Promise<HourlyMajorRates> {
  const code = currencyCode.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error("Currency must be a 3-letter ISO 4217 code.");
  }
  if (!Number.isFinite(hourlyLocal) || hourlyLocal <= 0) {
    throw new Error("Hourly rate must be a positive number.");
  }

  const isMajor = (MAJOR as readonly string[]).includes(code);

  if (isMajor) {
    const base = code as Major;
    const others = MAJOR.filter((c) => c !== base);
    const data = await fetchFrankfurter(base, others.join(","));

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

  const data = await fetchFrankfurter(code, "USD,GBP,EUR");
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
