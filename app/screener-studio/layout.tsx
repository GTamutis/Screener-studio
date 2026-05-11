import { currentUser } from "@clerk/nextjs/server";
import { SectionShell } from "@/components/section-shell";
import { formatUserDisplayName } from "@/lib/format-display-name";

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
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  return (
    <SectionShell
      brandLabel="Screener Studio"
      brandHref="/screener-studio"
      sectionRootHref="/screener-studio"
      navItems={NAV_ITEMS}
      displayName={displayName}
    >
      {children}
    </SectionShell>
  );
}
