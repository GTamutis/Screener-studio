import Image from "next/image";

/** Navy wordmark for light / glass UI */
const SRC_ON_LIGHT = "/brand/day-one-logo-dark.png";
/** White wordmark for dark page backgrounds */
const SRC_ON_DARK = "/brand/day-one-logo-white.png";

export function DayOneWordmark({
  className,
  priority,
  /** `onDark` — white logo (use with a dark section background). */
  tone = "onLight",
}: {
  className?: string;
  priority?: boolean;
  tone?: "onLight" | "onDark";
}) {
  const src = tone === "onDark" ? SRC_ON_DARK : SRC_ON_LIGHT;
  return (
    <Image
      src={src}
      alt="Day One Strategy"
      width={2000}
      height={518}
      className={className}
      priority={priority}
    />
  );
}
