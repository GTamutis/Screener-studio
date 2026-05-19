import Link from "next/link";
import { AlertTriangle, Settings2 } from "lucide-react";

import { listApprovedLibraryQuestions } from "@/app/actions/question-library";
import { QuestionLibraryBrowser } from "@/components/question-library/question-library-browser";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { canManageQuestionLibrary } from "@/lib/auth/require-library-admin";

export default async function ScreenerQuestionLibraryPage() {
  const canManage = await canManageQuestionLibrary();
  let result: Awaited<ReturnType<typeof listApprovedLibraryQuestions>>;
  try {
    result = await listApprovedLibraryQuestions();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load the question library.";
    result = { error: message };
  }

  const setupError = "error" in result ? result.error : null;
  const questions = "error" in result ? [] : result;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Screener Studio"
        title="Question library"
        description="Browse approved screening questions. Search, filter by category, and preview full wording before adding to a screener."
        actions={
          canManage ? (
            <Button asChild variant="default" className="gap-2">
              <Link href="/dashboard/admin/question-library">
                <Settings2 className="h-4 w-4" />
                Manage library
              </Link>
            </Button>
          ) : undefined
        }
      />

      {setupError ? (
        <GlassCard className="flex items-start gap-4 border-amber-300/40 bg-amber-50/60 p-6 text-amber-950 ring-1 ring-inset ring-amber-200/40 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Could not load questions</p>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/80">
              {setupError}
            </p>
          </div>
        </GlassCard>
      ) : (
        <QuestionLibraryBrowser questions={questions} />
      )}
    </div>
  );
}
