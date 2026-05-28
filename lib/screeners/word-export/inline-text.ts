import { TextRun } from "docx";

import { COLORS, FONTS, SIZE_BODY } from "./constants";
import { bodyRun, placeholderRun } from "./styles";

const PLACEHOLDER_RE = /\[([^\]]+)\]/g;
const PROGRAMMING_NOTE_RE =
  /^\[(INCLUDE|EXCLUDE|ASK|RANDOMIZE|RANGE|EDIT|INSERT|PROGRAMMING)[^\]]*\]$/i;

function isProgrammingNote(inner: string): boolean {
  const trimmed = inner.trim();
  return PROGRAMMING_NOTE_RE.test(`[${trimmed}]`);
}

/** Split statement text into body / placeholder / programming-note runs (§9, §15). */
export function statementTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let lastIndex = 0;

  const matches = Array.from(text.matchAll(PLACEHOLDER_RE));
  for (const match of matches) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      runs.push(bodyRun(text.slice(lastIndex, index)));
    }

    const inner = match[1] ?? "";
    const bracketed = `[${inner}]`;

    if (isProgrammingNote(inner)) {
      runs.push(
        new TextRun({
          text: bracketed,
          font: FONTS.body,
          size: SIZE_BODY,
          bold: true,
          color: COLORS.brandNavy,
        }),
      );
    } else {
      runs.push(placeholderRun(bracketed));
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(bodyRun(text.slice(lastIndex)));
  }

  if (runs.length === 0) {
    runs.push(bodyRun(text));
  }

  return runs;
}

/** Recruiter note below a question (§15). */
export function programmingNoteParagraphText(note: string): TextRun[] {
  const trimmed = note.trim();
  if (!trimmed) return [];

  const isAmberHold = /PLACE ON HOLD|CONTACT DOS|CONTACT DAY ONE/i.test(trimmed);

  return [
    new TextRun({
      text: trimmed.startsWith("[") ? trimmed : `[${trimmed}]`,
      font: FONTS.body,
      size: 20,
      bold: true,
      color: isAmberHold ? COLORS.amber : COLORS.brandNavy,
    }),
  ];
}
