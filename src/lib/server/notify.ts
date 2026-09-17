import type { AppEnv } from "./env";

/**
 * Resend delivery is a NOTIFICATION, never the record. The enquiry/booking row
 * is already persisted before we get here, so a non-2xx response must be
 * recorded as a delivery failure — not swallowed, not retried inline (which
 * risks duplicates), and never logged with the API key or full recipient body.
 */
export type NotificationOutcome =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

const FROM = "noreply@uktalentlink.co.uk";
const TO = ["info@uktalentlink.co.uk"];

type Email = {
  subject: string;
  text: string;
  replyTo?: string | null;
};

/** Redacts anything that looks like a credential and truncates for storage. */
function safeReason(input: string): string {
  return input
    .replace(/re_[A-Za-z0-9_-]{8,}/g, "[redacted-key]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export async function sendNotificationEmail(
  env: AppEnv,
  email: Email,
): Promise<NotificationOutcome> {
  if (!env.RESEND_API_KEY) {
    return { status: "skipped", reason: "RESEND_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        subject: email.subject,
        text: email.text,
      }),
    });

    if (!res.ok) {
      const body = safeReason(await res.text().catch(() => ""));
      const reason = `Resend HTTP ${res.status}${body ? `: ${body}` : ""}`;
      // Safe log: status + redacted provider message, no key, no message body.
      console.error("[notify] delivery failed", { status: res.status, reason });
      return { status: "failed", reason };
    }
    return { status: "sent" };
  } catch (err) {
    const reason = safeReason(err instanceof Error ? err.message : String(err));
    console.error("[notify] delivery error", { reason });
    return { status: "failed", reason };
  }
}

export function enquiryEmail(e: {
  name: string;
  email: string;
  company?: string | null;
  enquiry_type?: string | null;
  message: string;
}): Email {
  return {
    subject: `New enquiry — ${e.name}${e.enquiry_type ? ` (${e.enquiry_type})` : ""}`,
    replyTo: e.email,
    text:
      `Name: ${e.name}\nEmail: ${e.email}\nCompany: ${e.company || "—"}\n` +
      `Type: ${e.enquiry_type || "—"}\n\n${e.message}\n`,
  };
}

export function bookingEmail(b: {
  contact_name: string;
  contact_email: string;
  topic_area?: string | null;
}): Email {
  return {
    subject: `New consultation booking — ${b.contact_name}`,
    replyTo: b.contact_email,
    text:
      `New consultation booking received.\n\nName: ${b.contact_name}\n` +
      `Email: ${b.contact_email}\nTopic: ${b.topic_area ?? "Not specified"}\n`,
  };
}
