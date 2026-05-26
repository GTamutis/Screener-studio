export type WorkspaceToolId = "screener-studio" | "invitely" | "fmv";

export type WorkspaceTool = {
  id: WorkspaceToolId;
  href: string;
  title: string;
  description: string;
  accent: string;
};

export const WORKSPACE_TOOLS: readonly WorkspaceTool[] = [
  {
    id: "screener-studio",
    href: "/screener-studio",
    title: "Screener Studio",
    description: "Build and publish screening workflows.",
    accent: "from-[hsl(var(--brand-from)/0.1)] to-transparent",
  },
  {
    id: "invitely",
    href: "/invitely",
    title: "Invitely",
    description: "Attendee lists and multi-country field invites.",
    accent: "from-[hsl(var(--dos-teal)/0.12)] to-transparent",
  },
  {
    id: "fmv",
    href: "/workspace/fair-market-values",
    title: "Fair Market Values",
    description:
      "Fair market hourly rates per client project, with historical FX conversion.",
    accent: "from-primary/12 to-transparent",
  },
] as const;
