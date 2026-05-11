"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

export function WorkspaceHeader({ displayName }: { displayName: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/workspace"
          className="text-sm font-semibold text-slate-900"
        >
          Workspace
        </Link>
        <div className="flex items-center gap-4">
          <span className="max-w-[220px] truncate text-sm text-slate-600 sm:max-w-md">
            {displayName}
          </span>
          <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
