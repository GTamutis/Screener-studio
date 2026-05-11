import { Folder, Plus } from "lucide-react";

import { PageHeader } from "@/components/ui/glass/page-header";
import { EmptyState } from "@/components/ui/glass/empty-state";
import { Button } from "@/components/ui/button";

export default function ScreenerProjectsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Screener Studio"
        title="Projects"
        description="A home for every screening project — active, paused, archived. Project list and management land here next."
        actions={
          <Button disabled>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <EmptyState
        icon={Folder}
        title="No projects yet"
        description="When projects are wired up, you'll see them here with status, country coverage, and quick filters."
      />
    </div>
  );
}
