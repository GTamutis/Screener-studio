import { currentUser } from "@clerk/nextjs/server";
import { SectionShell } from "@/components/section-shell";
import { formatUserDisplayName } from "@/lib/format-display-name";

const NAV_ITEMS = [{ href: "/projects", label: "All projects" }] as const;

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  return (
    <SectionShell
      brandLabel="Projects"
      brandHref="/projects"
      sectionRootHref="/projects"
      navItems={NAV_ITEMS}
      displayName={displayName}
    >
      {children}
    </SectionShell>
  );
}
