import { Sparkles } from "lucide-react";

export function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}
