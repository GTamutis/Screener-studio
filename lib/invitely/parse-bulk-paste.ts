import { EMAIL_MAX, isValidEmail, normalizeWhitespace } from "@/lib/invitely/validation";

const EMAIL_RE =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function acceptEmail(email: string) {
  const e = normalizeWhitespace(email);
  if (!e || e.length > EMAIL_MAX || !isValidEmail(e)) return null;
  return normalizeEmail(e);
}

function collectEmailsFromLine(line: string, into: Set<string>) {
  const matches = Array.from(line.matchAll(EMAIL_RE));
  for (const match of matches) {
    const email = acceptEmail(match[0]);
    if (email) into.add(email);
  }
}

/**
 * Extract unique email addresses from messy pasted text (tables, CSV, Outlook dumps, etc.).
 * Names are not inferred — add them manually in the attendee matrix if needed.
 */
export function parseBulkPasteEmails(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];

  const seen = new Set<string>();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    collectEmailsFromLine(line, seen);
  }

  if (seen.size === 0) {
    collectEmailsFromLine(text.replace(/\s+/g, " "), seen);
  }

  return Array.from(seen);
}
