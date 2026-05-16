"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FolderPlus, Loader2, Plus } from "lucide-react";

import { createProject } from "@/app/actions/projects";

import { ProjectMarketsInput } from "@/components/projects/project-markets-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  const handleSubmit = (formData: FormData) => {
    if (selectedMarkets.length === 0) {
      toast.error("Select at least one market.");
      return;
    }

    startTransition(async () => {
      const clientName = String(formData.get("clientName") ?? "");
      const projectNumber = String(formData.get("projectNumber") ?? "");
      const projectName = String(formData.get("projectName") ?? "");

      const res = await createProject({
        clientName,
        projectNumber,
        projectName,
        markets: selectedMarkets,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Project created.");
      setOpen(false);
      setSelectedMarkets([]);
      const form = document.getElementById(
        "new-project-form",
      ) as HTMLFormElement | null;
      form?.reset();
      router.push(`/projects/${res.id}`);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelectedMarkets([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <FolderPlus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto overflow-x-hidden p-0 sm:max-w-lg">
        <div className="relative border-b border-border/40 bg-brand-gradient-soft px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-left text-base font-semibold tracking-tight text-foreground">
                New project
              </DialogTitle>
              <DialogDescription className="text-left text-xs text-muted-foreground">
                Projects are shared across workspace tools as you link records.
              </DialogDescription>
            </div>
          </div>
        </div>
        <form
          id="new-project-form"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="project-client">Client</Label>
            <Input
              required
              id="project-client"
              name="clientName"
              placeholder="Client name"
              autoComplete="organization"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-number">Project number</Label>
            <Input
              required
              id="project-number"
              name="projectNumber"
              placeholder="e.g. 2025-0142"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              required
              id="project-name"
              name="projectName"
              placeholder="Study or initiative title"
              disabled={pending}
            />
          </div>
          <ProjectMarketsInput
            id="project-markets-input"
            value={selectedMarkets}
            onChange={setSelectedMarkets}
            disabled={pending}
          />
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4" />
                Create project
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
