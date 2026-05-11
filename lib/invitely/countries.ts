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
