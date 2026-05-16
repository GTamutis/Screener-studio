import { SectionShell } from "@/components/section-shell";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

const NAV_ITEMS = [{ href: "/invitely", label: "Sessions" }] as const;

export default async function InvitelyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await getAuthenticatedShellProps();

  return (
    <SectionShell
      brandLabel="Invitely"
      brandHref="/invitely"
      sectionRootHref="/invitely"
      navItems={NAV_ITEMS}
      {...shell}
    >
      {children}
    </SectionShell>
  );
}
