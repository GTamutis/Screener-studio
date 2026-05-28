export type ProjectSpecs = {
  openText: string;
  objectives: string;
  therapyArea: string;
  backgroundInformation: string;
  terminationCriteria: string;
  additionalNotes: string;
};

export type ProjectSpecFieldKey = keyof ProjectSpecs;

export const PROJECT_SPEC_FIELD_MAX = 8000;

export const PROJECT_SPEC_FIELDS: {
  key: ProjectSpecFieldKey;
  label: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "openText",
    label: "Project Description",
    placeholder:
      "General project description, study design notes, or anything the team should know…",
    rows: 4,
  },
  {
    key: "objectives",
    label: "Objectives",
    placeholder: "Research objectives and what the screener must establish…",
    rows: 4,
  },
  {
    key: "therapyArea",
    label: "Therapy area",
    placeholder: "e.g. Oncology · NSCLC, Dermatology, Rare disease…",
    rows: 2,
  },
  {
    key: "backgroundInformation",
    label: "Background information",
    placeholder: "Indication, patient population, prior waves, client context…",
    rows: 4,
  },
  {
    key: "terminationCriteria",
    label: "Termination criteria",
    placeholder:
      "When to terminate, quota rules, exclusion principles for recruiters…",
    rows: 4,
  },
  {
    key: "additionalNotes",
    label: "Additional notes",
    placeholder: "Anything else that should inform question design…",
    rows: 3,
  },
];

export function emptyProjectSpecs(): ProjectSpecs {
  return {
    openText: "",
    objectives: "",
    therapyArea: "",
    backgroundInformation: "",
    terminationCriteria: "",
    additionalNotes: "",
  };
}

export function normalizeProjectSpecs(raw: unknown): ProjectSpecs {
  const empty = emptyProjectSpecs();
  if (typeof raw !== "object" || raw === null) return empty;

  const row = raw as Record<string, unknown>;
  const trim = (key: ProjectSpecFieldKey) =>
    typeof row[key] === "string" ? (row[key] as string).trim() : "";

  return {
    openText: trim("openText"),
    objectives: trim("objectives"),
    therapyArea: trim("therapyArea"),
    backgroundInformation: trim("backgroundInformation"),
    terminationCriteria: trim("terminationCriteria"),
    additionalNotes: trim("additionalNotes"),
  };
}

export function projectSpecsHasContent(specs: ProjectSpecs): boolean {
  return PROJECT_SPEC_FIELDS.some((f) => specs[f.key].length > 0);
}

/** Formatted block sent to the AI chat API as project brief context. */
export function formatProjectSpecsForAi(
  specs: ProjectSpecs,
  projectMeta: {
    clientName: string;
    projectName: string;
    projectNumber: string;
    screenerName: string;
    markets: string[];
  },
): string {
  const sections: string[] = [
    `Client: ${projectMeta.clientName}`,
    `Project: ${projectMeta.projectName} (${projectMeta.projectNumber})`,
    `Screener: ${projectMeta.screenerName}`,
  ];

  if (projectMeta.markets.length > 0) {
    sections.push(`Markets: ${projectMeta.markets.join(", ")}`);
  }

  for (const field of PROJECT_SPEC_FIELDS) {
    const value = specs[field.key];
    if (value) {
      sections.push(`## ${field.label}\n\n${value}`);
    }
  }

  return sections.join("\n\n");
}

export function validateProjectSpecsInput(
  specs: ProjectSpecs,
): { ok: true; specs: ProjectSpecs } | { ok: false; error: string } {
  for (const field of PROJECT_SPEC_FIELDS) {
    if (specs[field.key].length > PROJECT_SPEC_FIELD_MAX) {
      return {
        ok: false,
        error: `${field.label} must be ${PROJECT_SPEC_FIELD_MAX} characters or fewer.`,
      };
    }
  }
  return { ok: true, specs };
}
