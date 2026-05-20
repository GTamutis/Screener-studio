"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createScreener } from "@/app/actions/screeners";
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

export function NewScreenerDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    const name = String(formData.get("name") ?? "");

    startTransition(async () => {
      const res = await createScreener({ projectId, name });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Screener created.");
      setOpen(false);
      const form = document.getElementById(
        "new-screener-form",
      ) as HTMLFormElement | null;
      form?.reset();
      router.push(`/workspace/screener-studio/${res.id}`);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Screener
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
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
                Add a screener to this project. You can build questions on the
                next screen.
              </DialogDescription>
            </div>
          </div>
        </div>
        <form
          id="new-screener-form"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="screener-name">Screener name</Label>
            <Input
              required
              id="screener-name"
              name="name"
              placeholder="e.g. Main incidence screener"
              autoComplete="off"
              disabled={pending}
              maxLength={200}
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full" size="lg">
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
