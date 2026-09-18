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

export async function deliverNotification(env: AppEnv, kind: "enquiries" | "bookings", id: string): Promise<NotificationOutcome> {
  try {
    return await claimAndDeliverNotification(env, kind, id);
  } catch {
    console.error("[notify] delivery state unavailable", { kind, id });
    return { status: "failed", reason: "Delivery state unavailable; check before resending" };
  }
}

/** Atomically claim one send; concurrent retries cannot send the same record. */
async function claimAndDeliverNotification(
  env: AppEnv,
  kind: "enquiries" | "bookings",
  id: string,
): Promise<NotificationOutcome> {
  if (kind !== "enquiries" && kind !== "bookings") throw new Error("Invalid notification kind");
  const now = Date.now();
  // Resend's idempotency keys expire after 24h. Stop retries before that
  // boundary; old or interrupted sends need provider-log reconciliation.
  const row = await env.DB.prepare(
    `UPDATE ${kind} SET notification_status='sending',
       notification_attempts=notification_attempts+1, notification_at=?
     WHERE id=? AND notification_status IN ('pending','failed','skipped')
       AND created_at > ? RETURNING *`,
  ).bind(now, id, now - 23 * 60 * 60 * 1000).first<Record<string, unknown>>();
  if (!row) return { status: "skipped", reason: "Already sent, in progress, or requires delivery reconciliation" };
  const email = kind === "enquiries"
    ? enquiryEmail({ name: String(row.name), email: String(row.email), company: row.company as string | null,
        enquiry_type: row.enquiry_type as string | null, message: String(row.message) })
    : bookingEmail({ contact_name: String(row.contact_name), contact_email: String(row.contact_email),
        topic_area: row.topic_area as string | null });
  const outcome = await sendNotificationEmail(env, email, `uktl-${kind}-${id}`);
  try {
    await env.DB.prepare(
      `UPDATE ${kind} SET notification_status=?, notification_error=? WHERE id=?`,
    ).bind(outcome.status, outcome.status === "sent" ? null : outcome.reason, id).run();
  } catch {
    // Keep the claimed row in 'sending' and require reconciliation: never
    // throw after saving the original enquiry and encourage resubmission.
    console.error("[notify] delivery state persistence failed", { kind, id });
    return { status: "failed", reason: "Delivery requires reconciliation" };
  }
  return outcome;
}

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
  idempotencyKey: string,
): Promise<NotificationOutcome> {
  if (!env.RESEND_API_KEY) {
    return { status: "skipped", reason: "RESEND_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
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
      const reason = `Resend HTTP ${res.status}`;
      console.error("[notify] delivery failed", { status: res.status });
      return { status: "failed", reason };
    }
    return { status: "sent" };
  } catch (err) {
    const reason = "Email delivery could not be confirmed";
    console.error("[notify] delivery could not be confirmed");
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
    subject: `Consultation request — ${b.contact_name}`,
    replyTo: b.contact_email,
    text:
      `Consultation request received; no appointment is confirmed.\n\nName: ${b.contact_name}\n` +
      `Email: ${b.contact_email}\nTopic: ${b.topic_area ?? "Not specified"}\n`,
  };
}
