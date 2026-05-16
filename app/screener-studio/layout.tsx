import { SectionShell } from "@/components/section-shell";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

const NAV_ITEMS = [
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

  return (
    <SectionShell
      brandLabel="Screener Studio"
      brandHref="/screener-studio"
      sectionRootHref="/screener-studio"
      navItems={NAV_ITEMS}
      {...shell}
    >
      {children}
    </SectionShell>
  );
}
