import { SignUp } from "@clerk/nextjs";

import { DayOneWordmark } from "@/components/brand/day-one-wordmark";
import { glassClerkAppearance } from "@/components/ui/glass/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]"
      />
      <div className="relative mb-10 flex flex-col items-center gap-2 text-center">
        <DayOneWordmark
          tone="onDark"
          priority
          className="h-10 w-auto drop-shadow-sm sm:h-12"
        />
        <p className="text-xs font-medium tracking-wide text-zinc-400">
          Create your account
        </p>
      </div>
      <div className="relative w-full max-w-md">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          forceRedirectUrl="/workspace"
          appearance={glassClerkAppearance}
        />
      </div>
      <p className="relative mt-10 text-[11px] text-zinc-500">
        © {new Date().getFullYear()} Day One Strategy
      </p>
    </div>
  );
}
