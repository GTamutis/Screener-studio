import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

import { glassClerkAppearance } from "@/components/ui/glass/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 rounded-full glass-surface px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground/80 transition hover:text-foreground"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-gradient text-white">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
        </span>
        Workspace
      </Link>
      <div className="w-full max-w-md">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          forceRedirectUrl="/workspace"
          appearance={glassClerkAppearance}
        />
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Powered by{" "}
        <span className="font-semibold text-foreground/80">Workspace</span>
      </p>
    </div>
  );
}
