import { SectionShell } from "@/components/section-shell";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";
import { canManageQuestionLibrary } from "@/lib/auth/require-library-admin";

const BASE_NAV = [
  { href: "/screener-studio", label: "Dashboard" },
  { href: "/screener-studio/projects", label: "Projects" },
  { href: "/screener-studio/question-library", label: "Question Library" },
] as const;

export default async function ScreenerStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await getAuthenticatedShellProps();
  const canManage = await canManageQuestionLibrary();
  const navItems = canManage
    ? [
        ...BASE_NAV,
        {
          href: "/dashboard/admin/question-library",
          label: "Library admin",
        },
      ]
    : [...BASE_NAV];

  return (
    <SectionShell
      brandLabel="Screener Studio"
      brandHref="/screener-studio"
      sectionRootHref="/screener-studio"
      navItems={navItems}
      {...shell}
    >
      {children}
    </SectionShell>
  );
}
