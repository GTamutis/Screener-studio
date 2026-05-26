import { ExternalLink, Newspaper } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";
import { workspaceCardClassName } from "@/lib/form-classes";
import { cn } from "@/lib/utils";

type OutreachArticleHeaderProps = {
  article: IndustryNewsItem;
  className?: string;
};

export function OutreachArticleHeader({
  article,
  className,
}: OutreachArticleHeaderProps) {
  return (
    <div className={cn(workspaceCardClassName, "px-5 py-4", className)}>
      <div className="flex items-start gap-2">
        <Newspaper
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-pretty text-base font-semibold leading-snug text-foreground">
            {article.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {article.source}
            <span className="mx-1.5 text-border">·</span>
            {formatRelativeTime(article.publishedAt)}
          </p>
          {article.summary ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {article.summary}
            </p>
          ) : null}
          {article.companies.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {article.companies.map((company) => (
                <Badge
                  key={company}
                  variant="secondary"
                  className="px-2 py-0 text-[10px] font-medium"
                >
                  {company}
                </Badge>
              ))}
            </div>
          ) : null}
          <Link
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Read full article
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
