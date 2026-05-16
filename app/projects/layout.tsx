import { SectionShell } from "@/components/section-shell";
import { getAuthenticatedShellProps } from "@/lib/auth/shell-props";

const NAV_ITEMS = [{ href: "/projects", label: "All projects" }] as const;

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await getAuthenticatedShellProps();

  return (
    <SectionShell
      brandLabel="Projects"
      brandHref="/projects"
      sectionRootHref="/projects"
      navItems={NAV_ITEMS}
      {...shell}
    >
      {children}
    </SectionShell>
  );
}
