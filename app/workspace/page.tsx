import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { WorkspaceHeader } from "@/components/workspace-header";
import { formatUserDisplayName } from "@/lib/format-display-name";

export default async function WorkspacePage() {
  const user = await currentUser();
  const displayName = formatUserDisplayName(user);

  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-geist-sans)]">
      <WorkspaceHeader displayName={displayName} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Choose an area
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Select where you want to work. You can come back here anytime via{" "}
          <span className="font-medium text-slate-800">Switch app</span>{" "}
          inside each section.
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          <li>
            <Link
              href="/screener-studio"
              className="block rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <h2 className="text-lg font-semibold text-blue-950">
                Screener Studio
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Screening workflows, projects, and your question library.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-950">
                Open →
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/project-management"
              className="block rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <h2 className="text-lg font-semibold text-blue-950">
                Project management tools
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Planning, tracking, and delivery helpers for your initiatives.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-950">
                Open →
              </span>
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
