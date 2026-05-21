import type { IndustryNewsItem } from "@/lib/workspace/industry-news-types";

import { WorkspaceNewsFeedClient } from "./workspace-news-feed-client";

type WorkspaceNewsFeedProps = {
  className?: string;
  items: IndustryNewsItem[];
  failedSources?: string[];
  sourceCounts?: import("@/lib/workspace/industry-news-types").IndustryNewsSourceCount[];
  projectClientNames?: string[];
};

export function WorkspaceNewsFeed(props: WorkspaceNewsFeedProps) {
  return <WorkspaceNewsFeedClient {...props} />;
}
