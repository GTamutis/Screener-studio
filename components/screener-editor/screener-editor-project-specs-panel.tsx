"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateProjectSpecs } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_SPEC_FIELDS,
  PROJECT_SPEC_FIELD_MAX,
  type ProjectSpecs,
} from "@/lib/projects/project-specs";

export function ScreenerEditorProjectSpecsPanel({
  projectId,
  screenerId,
  specs,
  onSpecsChange,
  onSpecsSaved,
}: {
  projectId: string;
  screenerId: string;
  specs: ProjectSpecs;
  /** Keeps editor AI/review context in sync while typing (before Save). */
  onSpecsChange?: (specs: ProjectSpecs) => void;
  onSpecsSaved: (specs: ProjectSpecs) => void;
}) {
  const [values, setValues] = useState<ProjectSpecs>(specs);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValues(specs);
  }, [specs]);

  const patch = (key: keyof ProjectSpecs, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      onSpecsChange?.(next);
      return next;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateProjectSpecs({
        projectId,
        screenerId,
        specs: values,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Project specs saved.");
      onSpecsSaved(res.specs);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
          Context for this project. AI chat and quality review use these fields
          when drafting and reviewing your screener.
        </p>

        <div className="space-y-4">
          {PROJECT_SPEC_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label
                htmlFor={`spec-${field.key}`}
                className="text-xs font-semibold text-foreground"
              >
                {field.label}
              </Label>
              <Textarea
                id={`spec-${field.key}`}
                rows={field.rows}
                value={values[field.key]}
                onChange={(e) => patch(field.key, e.target.value)}
                placeholder={field.placeholder}
                disabled={pending}
                maxLength={PROJECT_SPEC_FIELD_MAX}
                className="resize-y text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/80 bg-[hsl(var(--workspace-panel))] p-3">
        <Button
          type="button"
          size="sm"
          className="h-9 w-full gap-1.5 text-xs"
          disabled={pending}
          onClick={handleSave}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save project specs
        </Button>
      </div>
    </div>
  );
}
