import { currentUser } from "@clerk/nextjs/server";
import { SectionShell } from "@/components/section-shell";
import { formatUserDisplayName } from "@/lib/format-display-name";

const NAV_ITEMS = [
  { href: "/project-management", label: "Overview" },
  { href: "/project-management/invitely", label: "Invitely" },
] as const;

export default async function ProjectManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  return (
    <SectionShell
      brandLabel="Project management tools"
      brandHref="/project-management"
      sectionRootHref="/project-management"
      navItems={NAV_ITEMS}
      displayName={displayName}
    >
      {children}
    </SectionShell>
  );
}
