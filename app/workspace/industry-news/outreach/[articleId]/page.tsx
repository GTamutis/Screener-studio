import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { listProjects } from "@/app/actions/projects";
import { OutreachAiChatPanel } from "@/components/workspace/outreach/outreach-ai-chat-panel";
import { OutreachArticleHeader } from "@/components/workspace/outreach/outreach-article-header";
import {
  WorkspaceStagger,
  WorkspaceStaggerItem,
} from "@/components/workspace/workspace-stagger";
import { getIndustryNewsArticleById } from "@/lib/workspace/outreach-ai/get-article";
import type { ProjectSummary } from "@/lib/projects/types";

type PageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function IndustryNewsOutreachPage({ params }: PageProps) {
  const { articleId } = await params;
  const article = await getIndustryNewsArticleById(articleId);

  if (!article) {
    notFound();
  }

  let projectClientNames: string[] = [];
  try {
    const result = await listProjects();
    if (!("error" in result)) {
      projectClientNames = Array.from(
        new Set(
          (result as ProjectSummary[])
            .map((p) => p.clientName.trim())
            .filter((name) => name.length >= 3),
        ),
      ).sort((a, b) => a.localeCompare(b));
    }
  } catch {
    projectClientNames = [];
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <WorkspaceStagger className="space-y-6">
        <WorkspaceStaggerItem>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to workspace
          </Link>
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem>
          <header className="space-y-1">
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Outreach assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              Create hooks, emails, or messages grounded in this headline.
            </p>
          </header>
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem>
          <OutreachArticleHeader article={article} />
        </WorkspaceStaggerItem>

        <WorkspaceStaggerItem>
          <OutreachAiChatPanel
            article={article}
            projectClientNames={projectClientNames}
          />
        </WorkspaceStaggerItem>
      </WorkspaceStagger>
    </div>
  );
}
