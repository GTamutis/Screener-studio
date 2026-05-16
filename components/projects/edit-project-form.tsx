"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, PencilLine } from "lucide-react";

import { updateProject } from "@/app/actions/projects";
import type { ProjectSummary } from "@/lib/projects/types";

import { ProjectMarketsInput } from "@/components/projects/project-markets-input";
import { GlassCard } from "@/components/ui/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditProjectForm({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientName, setClientName] = useState(project.clientName);
  const [projectNumber, setProjectNumber] = useState(project.projectNumber);
  const [projectName, setProjectName] = useState(project.projectName);
  const [markets, setMarkets] = useState<string[]>(() => [...project.markets]);

  const handleSave = () => {
    if (markets.length === 0) {
      toast.error("Select at least one market.");
      return;
    }

    startTransition(async () => {
      const res = await updateProject({
        id: project.id,
        clientName,
        projectNumber,
        projectName,
        markets,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Project saved.");
      router.refresh();
    });
  };

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="relative border-b border-border/40 bg-brand-gradient-soft px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
            <PencilLine className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Edit details
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Updates apply everywhere this project appears.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="edit-project-client">Client</Label>
          <Input
            id="edit-project-client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name"
            autoComplete="organization"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-project-number">Project number</Label>
          <Input
            id="edit-project-number"
            value={projectNumber}
            onChange={(e) => setProjectNumber(e.target.value)}
            placeholder="e.g. 2025-0142"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-project-name">Project name</Label>
          <Input
            id="edit-project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Study or initiative title"
            disabled={pending}
          />
        </div>
        <ProjectMarketsInput
          id="edit-project-markets"
          value={markets}
          onChange={setMarkets}
          disabled={pending}
        />
        <Button
          type="button"
          className="w-full sm:w-auto"
          size="lg"
          disabled={pending}
          onClick={handleSave}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <PencilLine className="h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}
