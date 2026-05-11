const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_MAX = 120;
export const EMAIL_MAX = 255;
export const ACTOR_NAME_MAX = 120;

export function isValidEmail(email: string) {
  if (email.length > EMAIL_MAX) return false;
  return EMAIL_RE.test(email.trim());
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
