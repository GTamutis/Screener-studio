import type { AppUserRole, AppUserStatus } from "@/lib/auth/constants";

export type AppUser = {
  id: string;
  clerkUserId: string | null;
  email: string;
  displayName: string | null;
  role: AppUserRole;
  status: AppUserStatus;
  createdAt: string;
  approvedAt: string | null;
};

export type AppUserRow = {
  id: string;
  clerk_user_id: string | null;
  email: string;
  display_name: string | null;
  role: AppUserRole;
  status: AppUserStatus;
  created_at: string;
  approved_at: string | null;
};

export function mapAppUser(row: AppUserRow): AppUser {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}
