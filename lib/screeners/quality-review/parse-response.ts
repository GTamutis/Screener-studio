import type {
  QualityReviewIssue,
  QualityReviewResult,
  QualityReviewSeverity,
} from "@/lib/screeners/quality-review/types";

const SEVERITIES = new Set<QualityReviewSeverity>([
  "error",
  "warning",
  "info",
]);

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

function parseIssue(raw: unknown, index: number): QualityReviewIssue | null {
  if (typeof raw !== "object" || raw === null) return null;

  const row = raw as Record<string, unknown>;
  const severityRaw =
    typeof row.severity === "string" ? row.severity.toLowerCase() : "";
  if (!SEVERITIES.has(severityRaw as QualityReviewSeverity)) return null;

  const description =
    typeof row.description === "string" ? row.description.trim() : "";
  const suggestion =
    typeof row.suggestion === "string" ? row.suggestion.trim() : "";
  const issue_type =
    typeof row.issue_type === "string"
      ? row.issue_type.trim()
      : typeof row.issueType === "string"
        ? row.issueType.trim()
        : "issue";

  if (!description) return null;

  let question_number: number | null = null;
  if (typeof row.question_number === "number" && Number.isFinite(row.question_number)) {
    question_number = row.question_number;
  } else if (typeof row.questionNumber === "number" && Number.isFinite(row.questionNumber)) {
    question_number = row.questionNumber;
  } else if (row.question_number === null || row.questionNumber === null) {
    question_number = null;
  }

  const id = `issue-${index}-${severityRaw}-${issue_type.slice(0, 24)}`;

  return {
    id,
    question_number,
    severity: severityRaw as QualityReviewSeverity,
    issue_type,
    description,
    suggestion,
  };
}

export function parseQualityReviewResponse(
  text: string,
): QualityReviewResult | null {
  const jsonText = extractJsonObject(text);
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const issuesRaw = Array.isArray(parsed.issues) ? parsed.issues : [];
    const issues: QualityReviewIssue[] = [];

    issuesRaw.forEach((item, index) => {
      const issue = parseIssue(item, index);
      if (issue) issues.push(issue);
    });

    const overall_comment =
      typeof parsed.overall_comment === "string"
        ? parsed.overall_comment.trim()
        : typeof parsed.overallComment === "string"
          ? parsed.overallComment.trim()
          : "";

    const loiRaw =
      parsed.estimated_loi_minutes ?? parsed.estimatedLoiMinutes;
    const estimated_loi_minutes =
      typeof loiRaw === "number" && Number.isFinite(loiRaw) ? loiRaw : 0;

    return {
      issues,
      overall_comment,
      estimated_loi_minutes,
    };
  } catch {
    return null;
  }
}
