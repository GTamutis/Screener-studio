import { requireLibraryAdmin } from "@/lib/auth/require-library-admin";

export default async function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireLibraryAdmin();
  return children;
}
