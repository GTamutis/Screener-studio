/**
 * Canonical market / country labels for multi-select UIs (e.g. workspace projects).
 * Invitely sessions still accept free-form comma-separated countries; this list is the
 * shared picker source of truth.
 */
export const INVITELY_MARKETS = [
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
] as const;

export type InvitelyMarketLabel = (typeof INVITELY_MARKETS)[number];

/** ISO 3166-1 alpha-2 codes aligned with {@link INVITELY_MARKETS} labels (workspace pickers). */
export const INVITELY_MARKET_ISO2 = {
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  "Czech Republic": "CZ",
  Denmark: "DK",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  "Hong Kong": "HK",
  India: "IN",
  Indonesia: "ID",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  Malaysia: "MY",
  Mexico: "MX",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Norway: "NO",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  "Saudi Arabia": "SA",
  Singapore: "SG",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Thailand: "TH",
  Turkey: "TR",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  Vietnam: "VN",
} as const satisfies Record<InvitelyMarketLabel, string>;

const MARKET_SET = new Set<string>(INVITELY_MARKETS);

export function isAllowedInvitelyMarket(value: string): boolean {
  return MARKET_SET.has(value);
}

export function getInvitelyMarketIso2(label: string): string | undefined {
  if (!isAllowedInvitelyMarket(label)) return undefined;
  return INVITELY_MARKET_ISO2[label as InvitelyMarketLabel];
}

export function parseCountryList(raw: string): string[] {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

export function filterCountriesForSession(
  sessionCountries: readonly string[],
  selected: readonly string[],
) {
  const allowed = new Set(sessionCountries);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of selected) {
    if (!allowed.has(c)) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}
