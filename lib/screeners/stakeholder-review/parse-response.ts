import {
  STAKEHOLDER_REVIEW_PERSONAS,
  STAKEHOLDER_REVIEW_SEVERITIES,
  type StakeholderReviewPersona,
  type StakeholderReviewSeverity,
} from "@/lib/screeners/stakeholder-review/constants";
import type {
  StakeholderReviewFeedbackItem,
  StakeholderReviewModelResponse,
} from "@/lib/screeners/stakeholder-review/types";

const SEVERITIES = new Set<StakeholderReviewSeverity>(
  STAKEHOLDER_REVIEW_SEVERITIES,
);

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}

function parseQuestionPosition(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.trunc(raw);
  }
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function parseFeedbackItem(raw: unknown): StakeholderReviewFeedbackItem | null {
  if (typeof raw !== "object" || raw === null) return null;

  const row = raw as Record<string, unknown>;
  const severityRaw =
    typeof row.severity === "string" ? row.severity.toLowerCase() : "";
  if (!SEVERITIES.has(severityRaw as StakeholderReviewSeverity)) return null;
  if (severityRaw === "green") return null;

  const feedback_text =
    typeof row.feedback_text === "string"
      ? row.feedback_text.trim()
      : typeof row.feedbackText === "string"
        ? row.feedbackText.trim()
        : "";
  if (!feedback_text) return null;

  const question_position = parseQuestionPosition(
    row.question_position ?? row.questionPosition,
  );

  return {
    question_position,
    severity: severityRaw as StakeholderReviewSeverity,
    feedback_text,
  };
}

function normalizePersonaKey(key: string): StakeholderReviewPersona | null {
  const normalized = key.trim().toLowerCase().replace(/-/g, "_");
  if (
    STAKEHOLDER_REVIEW_PERSONAS.includes(normalized as StakeholderReviewPersona)
  ) {
    return normalized as StakeholderReviewPersona;
  }
  return null;
}

export function parseStakeholderReviewResponse(
  text: string,
): StakeholderReviewModelResponse | null {
  const jsonText = extractJsonObject(text);
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const result = {} as StakeholderReviewModelResponse;

    for (const persona of STAKEHOLDER_REVIEW_PERSONAS) {
      result[persona] = [];
    }

    for (const [key, value] of Object.entries(parsed)) {
      const persona = normalizePersonaKey(key);
      if (!persona || !Array.isArray(value)) continue;

      for (const item of value) {
        const feedback = parseFeedbackItem(item);
        if (feedback) result[persona].push(feedback);
      }
    }

    return result;
  } catch {
    return null;
  }
}
