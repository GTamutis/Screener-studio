import { EMAIL_MAX, isValidEmail, NAME_MAX, normalizeWhitespace } from "@/lib/invitely/validation";

const EMAIL_RE =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;

export type ParsedBulkAttendee = { name: string; email: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function clampName(name: string) {
  const n = normalizeWhitespace(name);
  if (!n || n.length > NAME_MAX) return "";
  return n;
}

function acceptEmail(email: string) {
  const e = normalizeWhitespace(email);
  if (!e || e.length > EMAIL_MAX || !isValidEmail(e)) return null;
  return normalizeEmail(e);
}

/** Pull a display name from text immediately before an email on the same line. */
function nameBeforeEmail(line: string, email: string, index: number) {
  const before = line.slice(0, index).trim();
  if (!before) return "";

  const angle = before.match(/^(.+?)\s*[<(]\s*$/);
  if (angle) return clampName(angle[1]);

  const separators = [",", ";", "\t", "|"];
  for (const sep of separators) {
    const sepIdx = before.lastIndexOf(sep);
    if (sepIdx !== -1) {
      const candidate = clampName(before.slice(sepIdx + 1));
      if (candidate) return candidate;
    }
  }

  if (before.length <= NAME_MAX && !before.includes("@")) {
    return clampName(before);
  }

  return "";
}

function nameAfterEmail(line: string, email: string, index: number) {
  const after = line.slice(index + email.length).trim();
  if (!after) return "";

  const separators = [",", ";", "\t", "|", "-", "—"];
  for (const sep of separators) {
    if (after.startsWith(sep)) {
      const candidate = clampName(after.slice(sep.length));
      if (candidate) return candidate;
    }
  }

  return "";
}

function parseLine(line: string, into: Map<string, ParsedBulkAttendee>) {
  const matches = Array.from(line.matchAll(EMAIL_RE));
  if (matches.length === 0) return;

  for (const match of matches) {
    const rawEmail = match[0];
    const email = acceptEmail(rawEmail);
    if (!email || into.has(email)) continue;

    const idx = match.index ?? 0;
    const name =
      nameBeforeEmail(line, rawEmail, idx) ||
      nameAfterEmail(line, rawEmail, idx);

    into.set(email, { name, email });
  }
}

/**
 * Extract unique attendees from messy pasted text (tables, CSV, Outlook dumps, etc.).
 * Email is required; name is optional.
 */
export function parseBulkPasteAttendees(raw: string): ParsedBulkAttendee[] {
  const text = raw.trim();
  if (!text) return [];

  const byEmail = new Map<string, ParsedBulkAttendee>();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    parseLine(line, byEmail);
  }

  if (byEmail.size === 0) {
    parseLine(text.replace(/\s+/g, " "), byEmail);
  }

  return Array.from(byEmail.values());
}
