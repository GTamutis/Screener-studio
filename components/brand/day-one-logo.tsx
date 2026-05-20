import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_DARK = "/brand/day-one-logo-dark.png";
const LOGO_WHITE = "/brand/day-one-logo-white.png";

const LOGO_WIDTH_PX = 2400;
const LOGO_HEIGHT_PX = 600;

export function DayOneLogo({
  className,
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      aria-hidden={decorative}
      {...(!decorative
        ? { role: "img" as const, "aria-label": "Day One Strategy" as const }
        : {})}
    >
      <Image
        src={LOGO_DARK}
        alt=""
        width={LOGO_WIDTH_PX}
        height={LOGO_HEIGHT_PX}
        draggable={false}
        sizes="160px"
        className="h-full w-auto object-contain dark:hidden"
        priority
      />
      <Image
        src={LOGO_WHITE}
        alt=""
        width={LOGO_WIDTH_PX}
        height={LOGO_HEIGHT_PX}
        draggable={false}
        sizes="160px"
        className="hidden h-full w-auto object-contain dark:block"
        priority
      />
    </span>
  );
}
