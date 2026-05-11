import { FileText, Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/ui/glass/page-header";
import { EmptyState } from "@/components/ui/glass/empty-state";
import { Button } from "@/components/ui/button";

export default function ScreenerQuestionLibraryPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Screener Studio"
        title="Question library"
        description="Browse and edit reusable screening questions. Tag, search, and drop them into any project."
        actions={
          <>
            <Button variant="glass" disabled>
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button disabled>
              <Plus className="h-4 w-4" />
              New question
            </Button>
          </>
        }
      />

      <EmptyState
        icon={FileText}
        title="Question library coming soon"
        description="Reusable questions, organised by tags and category, will appear here. Until then you can scaffold them in project-specific screeners."
      />
    </div>
  );
}
