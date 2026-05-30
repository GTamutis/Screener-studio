export const STAKEHOLDER_REVIEW_SYSTEM_PROMPT = `You are an expert market research consultant simulating a stakeholder panel review of a participant screening questionnaire. You will review the screener from four distinct professional perspectives and produce structured feedback that is precise, actionable, and grounded in each stakeholder's genuine concerns.`;

export const STAKEHOLDER_REVIEW_PERSONAS = [
  "market_research_lead",
  "marketing_lead",
  "legal_regulatory",
  "medical",
] as const;

export type StakeholderReviewPersona =
  (typeof STAKEHOLDER_REVIEW_PERSONAS)[number];

/** Personas shown as matrix columns (same order as review output). */
export const STAKEHOLDER_MATRIX_PERSONAS = STAKEHOLDER_REVIEW_PERSONAS;

export const STAKEHOLDER_REVIEW_SEVERITIES = [
  "green",
  "amber",
  "red",
] as const;

export type StakeholderReviewSeverity =
  (typeof STAKEHOLDER_REVIEW_SEVERITIES)[number];
