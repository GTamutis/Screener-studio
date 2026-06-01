import type { ScreenerWithProject } from "@/lib/screeners/types";
import type { ScreenerQuestion } from "@/lib/screeners/question-types";
import {
  formatProjectSpecsForAi,
  projectSpecsHasContent,
} from "@/lib/projects/project-specs";
import type { QuestionAnswerOption } from "@/lib/question-library/types";
import { flattenQuestionTree, buildQuestionTree } from "@/lib/screeners/question-tree";

function formatAnswerOptions(options: QuestionAnswerOption[]): string {
  if (options.length === 0) return "(none)";
  return options
    .map((o) => {
      const parts = [o.text];
      if (o.terminate) parts.push("[terminate]");
      if (o.logicNote?.trim()) parts.push(`(${o.logicNote.trim()})`);
      return parts.join(" ");
    })
    .join("; ");
}

function formatBrief(screener: ScreenerWithProject): string {
  if (projectSpecsHasContent(screener.projectSpecs)) {
    return formatProjectSpecsForAi(screener.projectSpecs, {
      clientName: screener.clientName,
      projectName: screener.projectName,
      projectNumber: screener.projectNumber,
      screenerName: screener.name,
      markets: screener.markets ?? [],
    });
  }
  return "(No project brief provided.)";
}

function formatTargetAudience(screener: ScreenerWithProject): string {
  const specs = screener.projectSpecs;
  const parts: string[] = [];
  if (specs.objectives) parts.push(`Objectives: ${specs.objectives}`);
  if (specs.therapyArea) parts.push(`Therapy area: ${specs.therapyArea}`);
  if (specs.terminationCriteria) {
    parts.push(`Termination criteria: ${specs.terminationCriteria}`);
  }
  if (screener.markets?.length) {
    parts.push(`Markets: ${screener.markets.join(", ")}`);
  }
  return parts.length > 0 ? parts.join("\n") : "(Not specified.)";
}

function formatMethodology(screener: ScreenerWithProject): string {
  const notes = screener.projectSpecs.additionalNotes.trim();
  if (notes) return notes;
  if (screener.markets?.length) {
    return `Markets: ${screener.markets.join(", ")}`;
  }
  return "(Not specified.)";
}

export function buildStakeholderReviewQuestionsSection(
  questions: ScreenerQuestion[],
): string {
  const tree = buildQuestionTree(questions);
  const flat = flattenQuestionTree(tree);
  const lines: string[] = [];

  for (let index = 0; index < flat.length; index++) {
    const item = flat[index];
    const type = item.question.questionType ?? "unknown";
    const options = formatAnswerOptions(item.question.answerOptions);
    const reviewPosition = index + 1;
    const indent = item.isSubQuestion ? "  " : "";
    lines.push(
      `${indent}${item.label} (review_position: ${reviewPosition}): ${item.question.questionText} | Type: ${type} | Options: ${options}`,
    );
  }

  return lines.length > 0 ? lines.join("\n") : "(No questions in screener.)";
}

export function buildStakeholderReviewUserMessage(
  screener: ScreenerWithProject,
  questions: ScreenerQuestion[],
): string {
  const questionsSection = buildStakeholderReviewQuestionsSection(questions);

  return `Please review the following screening questionnaire and provide structured feedback from four stakeholder perspectives.

PROJECT CONTEXT:
- Project name: ${screener.projectName}
- Client: ${screener.clientName}
- Methodology: ${formatMethodology(screener)}
- Brief: ${formatBrief(screener)}
- Target audience: ${formatTargetAudience(screener)}

SCREENER QUESTIONS:
${questionsSection}

Review from each of these four personas:

1. MARKET RESEARCH LEAD — Reviews for: methodological quality, question neutrality,
   logical flow, appropriate screening criteria, length of interview concerns,
   question type appropriateness, order effects.

2. MARKETING LEAD — Reviews for: brand sensitivity, whether the screener might
   reveal the sponsoring company, whether questions could bias respondents,
   whether target audience matches strategic goals.

3. LEGAL AND REGULATORY — Reviews for: GDPR/data protection compliance, consent
   language adequacy, double-blind integrity, Sunshine Act implications, any
   questions that ask for personally identifiable clinical information, claims
   that could be considered off-label promotion.

4. MEDICAL — Reviews for: clinical accuracy of terminology, whether inclusion/exclusion
   criteria are clinically sound, whether screener criteria are realistic given
   incidence rates, whether the study could inadvertently enroll unsafe participants,
   any protocol-level risks.

For each persona, for each question (and for the screener overall if applicable):
- Assign severity: green (no issue), amber (minor concern/suggestion), red (significant issue)
- Write feedback_text: 1-3 sentences explaining the concern or confirmation of no issue
- Only include entries for amber and red — omit green entries to keep the response concise

When referencing a specific question, set question_position to the numeric review_position shown in parentheses on that question's line. Use null for overall screener feedback.

Return ONLY a valid JSON object in exactly this format:
{
  "market_research_lead": [
    { "question_position": 1, "severity": "amber", "feedback_text": "..." },
    { "question_position": null, "severity": "red", "feedback_text": "..." }
  ],
  "marketing_lead": [...],
  "legal_regulatory": [...],
  "medical": [...]
}
Where question_position is the question's review_position number or null for overall feedback.`;
}
