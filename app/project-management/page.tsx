import Link from "next/link";

export default function ProjectManagementHomePage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Use{" "}
        <Link className="font-medium text-blue-950 underline" href="/project-management/invitely">
          Invitely
        </Link>{" "}
        to collect password-protected attendee lists for multi-country studies. Other tools can be added under{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
          app/project-management
        </code>
        .
      </p>
    </main>
  );
}
