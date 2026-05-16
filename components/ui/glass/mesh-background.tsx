import { cn } from "@/lib/utils";

export function MeshBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-mesh-light dark:bg-mesh-dark" />

      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-slate-300/35 via-slate-400/20 to-transparent blur-3xl animate-blob-1 dark:from-slate-600/20 dark:via-slate-700/12" />
      <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-sky-200/30 via-blue-300/22 to-transparent blur-3xl animate-blob-2 dark:from-blue-900/25 dark:via-slate-800/18" />
      <div className="absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-amber-100/35 via-stone-300/25 to-transparent blur-3xl animate-blob-3 dark:from-stone-700/15 dark:via-slate-800/18" />

      <div
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/40 dark:via-background/5 dark:to-background/60" />
    </div>
  );
}
