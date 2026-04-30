// Resend wrapper. Best-effort: returns false on misconfiguration so lead capture
// never fails because email is down.

import type { AppEnv } from "./env";
import type { Lead } from "../schemas";

export async function sendLeadNotification(
  env: AppEnv,
  lead: Lead,
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL || !env.FROM_EMAIL) return false;
  const subject = `New Lead: ${lead.name} — ${lead.service} [${lead.priority}]`;
  const html = `
    <div style="font-family:Outfit,Arial,sans-serif;color:#1a1a2e;line-height:1.6;max-width:560px">
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;color:#0d1b2a;margin:0 0 8px">New enquiry — ${lead.name}</h2>
      <p style="color:#5a6478;margin:0 0 20px">Score: <strong style="color:#b8975a">${lead.score}/100</strong> · Priority: <strong>${lead.priority}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#8a94a6;width:120px">Company</td><td>${escape(lead.company ?? "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#8a94a6">Email</td><td>${escape(lead.email)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a94a6">Phone</td><td>${escape(lead.phone ?? "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#8a94a6">Service</td><td>${escape(lead.service)}</td></tr>
      </table>
      <p style="margin:20px 0 6px;color:#8a94a6;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Message</p>
      <div style="background:#f5f0e8;padding:14px 16px;border-radius:3px;color:#1a1a2e">${escape(lead.message ?? "(no message)")}</div>
      <p style="margin-top:24px;font-size:12px;color:#8a94a6">Open the dashboard to draft a reply.</p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `UK Talent Link <${env.FROM_EMAIL}>`,
        to: [env.ADMIN_EMAIL],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
