"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createProject } from "@/app/actions/projects";
import { createScreener } from "@/app/actions/screeners";
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
import { FilterSelect } from "@/components/ui/filter-select";
import { Label } from "@/components/ui/label";
import type { ProjectSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

type ProjectMode = "existing" | "new";

function projectOptionLabel(project: ProjectSummary) {
  return `${project.clientName} · ${project.projectName} (${project.projectNumber})`;
}

export function NewScreenerStudioDialog({
  projects,
}: {
  projects: ProjectSummary[];
}) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [projectMode, setProjectMode] = useState<ProjectMode>(
    projects.length > 0 ? "existing" : "new",
  );
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id ?? "",
  );
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  const resetForm = () => {
    setProjectMode(projects.length > 0 ? "existing" : "new");
    setSelectedProjectId(projects[0]?.id ?? "");
    setSelectedMarkets([]);
    const form = document.getElementById(formId) as HTMLFormElement | null;
    form?.reset();
  };

  const handleSubmit = (formData: FormData) => {
    const screenerName = String(formData.get("screenerName") ?? "").trim();
    if (!screenerName) {
      toast.error("Screener name is required.");
      return;
    }

    startTransition(async () => {
      let projectId = selectedProjectId;

      if (projectMode === "new") {
        if (selectedMarkets.length === 0) {
          toast.error("Select at least one market.");
          return;
        }

        const res = await createProject({
          clientName: String(formData.get("clientName") ?? ""),
          projectNumber: String(formData.get("projectNumber") ?? ""),
          projectName: String(formData.get("projectName") ?? ""),
          markets: selectedMarkets,
        });

        if (!res.ok) {
          toast.error(res.error);
          return;
        }

        projectId = res.id;
      } else if (!projectId) {
        toast.error("Select a project.");
        return;
      }

      const screenerRes = await createScreener({
        projectId,
        name: screenerName,
      });

      if (!screenerRes.ok) {
        toast.error(screenerRes.error);
        return;
      }

      toast.success("Screener created.");
      setOpen(false);
      resetForm();
      router.push(`/workspace/screener-studio/${screenerRes.id}`);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Screener
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto overflow-x-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/40 bg-brand-gradient-soft px-6 py-5">
            <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-left text-base font-semibold tracking-tight text-foreground">
                New screener
              </DialogTitle>
              <DialogDescription className="text-left text-xs text-muted-foreground">
                Link to an existing project or create a new one, then open the
                screener editor.
              </DialogDescription>
            </div>
          </div>
        </div>
        <form
          id={formId}
          className="space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-screener-name`}>Screener name</Label>
            <Input
              required
              id={`${formId}-screener-name`}
              name="screenerName"
              placeholder="e.g. Main incidence screener"
              autoComplete="off"
              disabled={pending}
              maxLength={200}
            />
          </div>

          <div className="space-y-3">
            <Label>Project</Label>
            <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
              <button
                type="button"
                disabled={pending || projects.length === 0}
                onClick={() => setProjectMode("existing")}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-xs font-medium transition",
                  projectMode === "existing"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  projects.length === 0 && "cursor-not-allowed opacity-50",
                )}
              >
                Existing project
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setProjectMode("new")}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-xs font-medium transition",
                  projectMode === "new"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                New project
              </button>
            </div>

            {projectMode === "existing" ? (
              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-project-id`} className="sr-only">
                  Select project
                </Label>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No projects yet. Switch to &quot;New project&quot; to create
                    one.
                  </p>
                ) : (
                  <FilterSelect
                    className="w-full"
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    disabled={pending}
                    aria-label="Select project"
                    options={projects.map((p) => ({
                      value: p.id,
                      label: projectOptionLabel(p),
                    }))}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`${formId}-client`}>Client</Label>
                  <Input
                    required
                    id={`${formId}-client`}
                    name="clientName"
                    placeholder="Client name"
                    disabled={pending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${formId}-number`}>Project number</Label>
                  <Input
                    required
                    id={`${formId}-number`}
                    name="projectNumber"
                    placeholder="e.g. 2025-0142"
                    disabled={pending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${formId}-project-name`}>Project name</Label>
                  <Input
                    required
                    id={`${formId}-project-name`}
                    name="projectName"
                    placeholder="Study or initiative title"
                    disabled={pending}
                  />
                </div>
                <ProjectMarketsInput
                  id={`${formId}-markets`}
                  value={selectedMarkets}
                  onChange={setSelectedMarkets}
                  disabled={pending}
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={
              pending ||
              (projectMode === "existing" && projects.length === 0)
            }
            className="w-full"
            size="lg"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Create screener
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

