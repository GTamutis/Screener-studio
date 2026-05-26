import Link from "next/link";

import { workspaceCardClassName } from "@/lib/form-classes";

export default function OutreachArticleNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <div className={workspaceCardClassName + " px-6 py-8"}>
        <h1 className="text-lg font-semibold text-foreground">
          Article not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This headline may have rolled off the feed. Open a recent article from
          Industry news on the workspace home page.
        </p>
        <Link
          href="/workspace"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to workspace
        </Link>
      </div>
    </div>
  );
}
