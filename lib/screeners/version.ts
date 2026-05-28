import type { ScreenerStatus } from "@/lib/screeners/types";

export type ScreenerVersionFields = {
  majorVersion: number;
  minorVersion: number;
  status: ScreenerStatus;
};

export function formatScreenerVersionLabel({
  majorVersion,
  minorVersion,
  status,
}: ScreenerVersionFields): string {
  if (status === "final") {
    return `v${majorVersion}`;
  }
  return `v${majorVersion}.${minorVersion}`;
}

/** Title-page metadata value (label column is separate). */
export function formatScreenerVersionMetadataValue(
  fields: ScreenerVersionFields,
): string {
  const label = formatScreenerVersionLabel(fields);
  if (fields.status === "final") {
    return `${label} — Final`;
  }
  return label;
}

/** Header line: screener name with version suffix. */
export function formatScreenerNameWithVersion(
  name: string,
  fields: ScreenerVersionFields,
): string {
  const trimmed = name.trim() || "Screener";
  return `${trimmed} — ${formatScreenerVersionLabel(fields)}`;
}

export function versionFieldsAfterSave(
  current: ScreenerVersionFields,
): Partial<Pick<ScreenerVersionFields, "status" | "minorVersion">> & {
  minorVersion: number;
} {
  if (current.status === "draft") {
    return { minorVersion: current.minorVersion + 1 };
  }
  return { status: "draft", minorVersion: 1 };
}

export function versionFieldsAfterSetFinal(
  current: Pick<ScreenerVersionFields, "majorVersion">,
): Pick<ScreenerVersionFields, "status" | "majorVersion" | "minorVersion"> {
  return {
    status: "final",
    majorVersion: current.majorVersion + 1,
    minorVersion: 0,
  };
}

export function versionFieldsAfterSetDraft(): Pick<
  ScreenerVersionFields,
  "status" | "minorVersion"
> {
  return { status: "draft", minorVersion: 1 };
}
