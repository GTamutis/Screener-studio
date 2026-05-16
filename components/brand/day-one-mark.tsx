import Image from "next/image";

import { cn } from "@/lib/utils";

const NAVY_SRC = "/brand/day-one-icon-dark.png";
const WHITE_SRC = "/brand/day-one-icon-white.png";

/** Square brand mark assets (exported at high resolution — scales down crisply via next/image). */
const MARK_SIZE_PX = 1080;

/**
 * Official Day One mark as PNG — avoids brittle SVG arcs at tiny sizes where strokes alias badly.
 */
export function DayOneMark({
  className,
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-grid h-6 w-6 shrink-0 place-items-center", className)}
      aria-hidden={decorative}
      {...(!decorative
        ? { role: "img" as const, "aria-label": "Day One Strategy" as const }
        : {})}
    >
      {/* Light UI: navy mark. Dark UI: white mark (`dark` comes from ThemeProvider). */}
      <Image
        src={NAVY_SRC}
        alt=""
        width={MARK_SIZE_PX}
        height={MARK_SIZE_PX}
        draggable={false}
        sizes="24px"
        className={cn(
          "col-start-1 row-start-1 h-full w-full object-contain",
          "dark:hidden",
        )}
      />
      <Image
        src={WHITE_SRC}
        alt=""
        width={MARK_SIZE_PX}
        height={MARK_SIZE_PX}
        draggable={false}
        sizes="24px"
        className={cn(
          "col-start-1 row-start-1 hidden h-full w-full object-contain dark:block",
        )}
      />
    </span>
  );
}
