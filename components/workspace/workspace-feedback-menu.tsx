"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Bug, HelpCircle, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { submitWorkspaceFeedback } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FEEDBACK_KIND_DESCRIPTIONS,
  FEEDBACK_KIND_LABELS,
  type WorkspaceFeedbackKind,
} from "@/lib/workspace/feedback/types";
import { cn } from "@/lib/utils";

export function WorkspaceFeedbackMenu({
  displayName,
  variant = "sidebar",
}: {
  displayName: string;
  variant?: "sidebar" | "header";
}) {
  const isHeader = variant === "header";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kind, setKind] = useState<WorkspaceFeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const openDialog = (nextKind: WorkspaceFeedbackKind) => {
    setKind(nextKind);
    setMessage("");
    setMenuOpen(false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      toast.error("Please add at least 10 characters of detail.");
      return;
    }

    startTransition(async () => {
      const result = await submitWorkspaceFeedback({
        kind,
        message: trimmed,
        pageUrl: pathname,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        kind === "bug"
          ? "Bug report sent — thank you."
          : "Suggestion sent — thank you.",
      );
      setDialogOpen(false);
      setMessage("");
    });
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground",
                  isHeader
                    ? "h-9 w-9 rounded-full glass-surface hover:border-foreground/20 hover:shadow-glass-sm data-[state=open]:border-foreground/20"
                    : "h-10 w-10 rounded-md hover:bg-secondary data-[state=open]:bg-secondary",
                )}
                aria-label="Help and feedback"
              >
                <HelpCircle
                  className={cn(
                    "stroke-[1.5]",
                    isHeader ? "h-4 w-4" : "h-[18px] w-[18px]",
                  )}
                />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side={isHeader ? "bottom" : "right"}>
            Help & feedback
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          side={isHeader ? "bottom" : "right"}
          align="end"
          className="w-56"
        >
          <DropdownMenuLabel>Help & feedback</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => openDialog("bug")}
          >
            <Bug className="h-4 w-4" />
            Report a bug
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => openDialog("suggestion")}
          >
            <Lightbulb className="h-4 w-4" />
            Suggest an improvement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="border-b border-border/40 bg-brand-gradient-soft px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-primary">
                {kind === "bug" ? (
                  <Bug className="h-4 w-4" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-left text-base font-semibold tracking-tight">
                  {FEEDBACK_KIND_LABELS[kind]}
                </DialogTitle>
                <DialogDescription className="mt-1 text-left text-sm">
                  {FEEDBACK_KIND_DESCRIPTIONS[kind]}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <p className="text-xs text-muted-foreground">
              Submitting as{" "}
              <span className="font-medium text-foreground">{displayName}</span>
              . We&apos;ll include the page you&apos;re on to help us
              investigate.
            </p>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Details</Label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={5000}
                placeholder={
                  kind === "bug"
                    ? "What happened? What did you expect instead?"
                    : "What would you like us to build or improve?"
                }
                className={cn(
                  "glass-input min-h-[120px] w-full resize-y rounded-lg px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Page context:{" "}
              <span className="font-mono">{pathname || "/"}</span>
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
