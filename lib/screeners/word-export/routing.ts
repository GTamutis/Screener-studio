import type { QuestionAnswerOption } from "@/lib/question-library/types";

import { COLORS } from "./constants";

export type RoutingStyle = {
  text: string;
  color: string;
  bold: boolean;
  allCaps: boolean;
};

const ROUTING_BY_KEY: Record<string, RoutingStyle> = {
  continue: { text: "CONTINUE", color: COLORS.primaryText, bold: true, allCaps: true },
  thank_and_close: {
    text: "THANK & CLOSE",
    color: COLORS.thankClose,
    bold: true,
    allCaps: true,
  },
  terminate: { text: "TERMINATE", color: COLORS.terminate, bold: true, allCaps: true },
  hold_contact_dos: {
    text: "HOLD & CONTACT DAY ONE",
    color: COLORS.amber,
    bold: true,
    allCaps: true,
  },
  see_below: { text: "SEE BELOW", color: COLORS.amber, bold: true, allCaps: true },
  info_only: { text: "INFO ONLY", color: COLORS.primaryText, bold: false, allCaps: true },
  please_proceed: {
    text: "PLEASE PROCEED",
    color: COLORS.primaryText,
    bold: true,
    allCaps: true,
  },
  academic: { text: "TAG AS ACADEMIC", color: COLORS.brandNavy, bold: true, allCaps: false },
  community: { text: "TAG AS COMMUNITY", color: COLORS.brandNavy, bold: true, allCaps: false },
  flag: { text: "CONTINUE & FLAG", color: COLORS.amber, bold: true, allCaps: true },
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function matchRoutingKey(raw: string): string | null {
  const key = normalizeKey(raw);
  if (ROUTING_BY_KEY[key]) return key;

  const aliases: Record<string, string> = {
    thank_close: "thank_and_close",
    thank_you_and_close: "thank_and_close",
    hold: "hold_contact_dos",
    hold_and_contact_day_one: "hold_contact_dos",
    hold_contact_day_one: "hold_contact_dos",
    hold_contact_dos: "hold_contact_dos",
    tag_as_academic: "academic",
    label_as_academic: "academic",
    tag_as_community: "community",
    recruit_a_mix: "community",
    proceed: "please_proceed",
  };

  if (aliases[key]) return aliases[key];

  if (key.includes("terminate")) return "terminate";
  if (key.includes("thank") && key.includes("close")) return "thank_and_close";
  if (key.includes("hold") && key.includes("contact")) return "hold_contact_dos";
  if (key.includes("see_below") || key === "see_below") return "see_below";
  if (key.includes("info_only")) return "info_only";
  if (key === "continue" || key.includes("continue")) return "continue";

  return null;
}

/** Resolve routing cell content per WORD_EXPORT_SPEC.md §21 */
export function resolveRoutingStyle(
  option: QuestionAnswerOption,
): RoutingStyle | null {
  const note = option.logicNote?.trim() ?? "";
  if (note) {
    const matched = matchRoutingKey(note);
    if (matched) return ROUTING_BY_KEY[matched];

    const upper = note.toUpperCase();
    if (/TERMINATE/.test(upper)) {
      return ROUTING_BY_KEY.terminate;
    }
    if (/THANK.*CLOSE/.test(upper)) {
      return ROUTING_BY_KEY.thank_and_close;
    }
    if (/HOLD.*CONTACT/.test(upper)) {
      return ROUTING_BY_KEY.hold_contact_dos;
    }

    const isAmberHold =
      /PLACE ON HOLD|CONTACT DOS|CONTACT DAY ONE/i.test(note) &&
      !/TERMINATE|THANK/i.test(note);

    return {
      text: isAmberHold ? note.toUpperCase() : note,
      color: isAmberHold ? COLORS.amber : COLORS.brandNavy,
      bold: true,
      allCaps: isAmberHold,
    };
  }

  if (option.terminate) {
    return ROUTING_BY_KEY.terminate;
  }

  return null;
}
