import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { adminRetryNotificationFn } from "@/lib/functions";

export function NotificationStatus({ kind, id, status, createdAt }: {
  kind: "enquiries" | "bookings"; id: string; status: string; createdAt: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const retryable = ["pending", "failed", "skipped"].includes(status)
    && Date.now() - createdAt < 23 * 60 * 60 * 1000;
  async function retry() {
    setBusy(true);
    try {
      const result = await adminRetryNotificationFn({ data: { kind, id } });
      setMessage(result.status === "sent" ? "Email sent" : result.reason);
      await router.invalidate();
    } catch {
      setMessage("Could not retry. Please check delivery before trying again.");
    } finally { setBusy(false); }
  }
  return <div className="mt-2 text-xs text-ink-mute">
    <span>Email: {status}</span>
    {retryable && <button type="button" disabled={busy} onClick={retry}
      className="ml-2 underline disabled:opacity-40">{busy ? "Sending…" : "Retry email"}</button>}
    {!retryable && status !== "sent" && <p>Check delivery with the email provider before resending.</p>}
    {message && <p role="status">{message}</p>}
  </div>;
}
