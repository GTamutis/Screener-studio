/** First sign-in promotes explicitly configured emails to admin + active. */
export const BOOTSTRAP_ADMIN_EMAILS: readonly string[] =
  process.env.BOOTSTRAP_ADMIN_EMAILS?.split(",")
    .map((e) => e.trim())
    .filter(Boolean) ?? [];

export type AppUserRole = "admin" | "member";
export type AppUserStatus = "pending" | "active" | "disabled";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBootstrapAdminEmail(email: string): boolean {
  const n = normalizeEmail(email);
  return BOOTSTRAP_ADMIN_EMAILS.some((e) => normalizeEmail(e) === n);
}
