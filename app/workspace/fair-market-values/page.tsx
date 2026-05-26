import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { listFmvEntries } from "@/app/actions/fmv";
import { PageHeader } from "@/components/ui/glass/page-header";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Button } from "@/components/ui/button";
import { FmvDatabaseTool } from "@/components/fmv/fmv-database-tool";

export default async function FairMarketValuesPage() {

  let result: Awaited<ReturnType<typeof listFmvEntries>>;
  try {
    result = await listFmvEntries();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load FMV entries.";
    result = { error: message };
  }

  if ("error" in result) {
    const setupError = result.error;
    return (
      <main className="w-full py-4">
          <div className="space-y-10">
            <PageHeader
              eyebrow="Workspace"
              title="Fair Market Values"
              description="Fair market hourly rates per client project, with historical FX conversion."
              actions={
                <Button asChild variant="secondary">
                  <Link href="/workspace">Back</Link>
                </Button>
              }
            />
            <GlassCard className="flex items-start gap-4 border-amber-300/40 bg-amber-50/60 p-6 text-amber-950 ring-1 ring-inset ring-amber-200/40 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-400/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Could not load FMV data</p>
                <p className="text-sm text-amber-900/90 dark:text-amber-100/80">
                  {setupError}
                </p>
              </div>
            </GlassCard>
          </div>
      </main>
    );
  }

  return (
    <main className="w-full py-4">
      <FmvDatabaseTool entries={result.entries} stats={result.stats} />
    </main>
  );
}
