import "server-only";

import type { WorkspaceFeedbackKind } from "@/lib/workspace/feedback/types";
import { FEEDBACK_KIND_LABELS } from "@/lib/workspace/feedback/types";

const DEFAULT_NOTIFY_EMAIL = "g.tamutis@dayonestrategy.com";

type FeedbackNotificationInput = {
  id: string;
  kind: WorkspaceFeedbackKind;
  message: string;
  pageUrl: string | null;
  userEmail: string;
  userDisplayName: string | null;
};

export async function sendFeedbackNotification(
  input: FeedbackNotificationInput,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to =
    process.env.FEEDBACK_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;
  const from =
    process.env.FEEDBACK_FROM_EMAIL?.trim() ||
    "Day One Workspace <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      "[feedback] RESEND_API_KEY is not set; saved to database but email was skipped.",
    );
    return { sent: false };
  }

  const kindLabel = FEEDBACK_KIND_LABELS[input.kind];
  const who = input.userDisplayName?.trim() || input.userEmail;
  const subject = `[Workspace] ${kindLabel} from ${who}`;

  const text = [
    `New ${kindLabel.toLowerCase()}`,
    "",
    `From: ${who} (${input.userEmail})`,
    `Page: ${input.pageUrl?.trim() || "Not provided"}`,
    `Submitted: ${new Date().toISOString()}`,
    `Reference: ${input.id}`,
    "",
    "---",
    "",
    input.message.trim(),
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[feedback] Resend API error:", response.status, body);
      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    console.error("[feedback] Failed to send notification email:", error);
    return { sent: false };
  }
}
