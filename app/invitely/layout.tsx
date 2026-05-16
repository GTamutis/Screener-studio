import { currentUser } from "@clerk/nextjs/server";
import { SectionShell } from "@/components/section-shell";
import { formatUserDisplayName } from "@/lib/format-display-name";

const NAV_ITEMS = [{ href: "/invitely", label: "Sessions" }] as const;

export default async function InvitelyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  return (
    <SectionShell
      brandLabel="Invitely"
      brandHref="/invitely"
      sectionRootHref="/invitely"
      navItems={NAV_ITEMS}
      displayName={displayName}
    >
      {children}
    </SectionShell>
  );
}
