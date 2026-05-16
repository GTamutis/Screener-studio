"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { deleteProject } from "@/app/actions/projects";

import { Button } from "@/components/ui/button";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    const ok = window.confirm(
      "Delete this project? Tool data already linked may become orphaned until you wire cleanup.",
    );
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteProject(projectId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Project deleted.");
      router.push("/projects");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={handleDelete}
      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Delete
    </Button>
  );
}
