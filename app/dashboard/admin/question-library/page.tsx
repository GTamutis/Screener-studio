import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { listAllLibraryQuestionsForAdmin } from "@/app/actions/question-library-admin";
import { QuestionLibraryAdmin } from "@/components/question-library/admin/question-library-admin";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Button } from "@/components/ui/button";

export default async function AdminQuestionLibraryPage() {
  const result = await listAllLibraryQuestionsForAdmin();

  if ("error" in result) {
    return (
      <GlassCard className="flex flex-col items-start gap-4 p-6 sm:flex-row">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-3">
          <p className="text-sm font-semibold">Could not load question library</p>
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <Button asChild variant="glass" size="sm">
            <Link href="/workspace">Back to workspace</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="glass" size="sm">
          <Link href="/screener-studio/question-library">View public library</Link>
        </Button>
      </div>
      <QuestionLibraryAdmin questions={result} />
    </div>
  );
}
