import { Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";

const PLACEHOLDER_ITEMS = [
  {
    title: "FDA updates oncology trial guidance",
    source: "Industry brief",
    time: "2 hours ago",
  },
  {
    title: "EU digital health framework: what brand teams should watch",
    source: "Regulatory",
    time: "Yesterday",
  },
  {
    title: "Patient access programmes shift post-launch priorities",
    source: "Market signals",
    time: "3 days ago",
  },
] as const;

export function WorkspaceNewsFeed({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Industry news
        </h2>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Placeholder
        </span>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {PLACEHOLDER_ITEMS.map((item) => (
          <li key={item.title} className="px-5 py-4">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.source}
              <span className="mx-1.5 text-border">·</span>
              {item.time}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Curated pharma and healthcare headlines will appear here once the feed is
        connected.
      </p>
    </section>
  );
}
