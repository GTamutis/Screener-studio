/** Calendar date YYYY-MM-DD in the local timezone of `at` (browser or server runtime). */
export function localCalendarIsoDate(at: Date = new Date()) {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
