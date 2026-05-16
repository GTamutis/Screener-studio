const DEFAULT_BOOTSTRAP_ADMIN_EMAILS = [
  "g.tamutis@dayonestrategy.com",
  "hello@gedas.info",
] as const;

/** First sign-in promotes to admin + active (break-glass bootstrap). */
export const BOOTSTRAP_ADMIN_EMAILS: readonly string[] =
  process.env.BOOTSTRAP_ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean) ??
  DEFAULT_BOOTSTRAP_ADMIN_EMAILS;

export type AppUserRole = "admin" | "member";
export type AppUserStatus = "pending" | "active" | "disabled";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBootstrapAdminEmail(email: string): boolean {
  const n = normalizeEmail(email);
  return BOOTSTRAP_ADMIN_EMAILS.some((e) => normalizeEmail(e) === n);
}
