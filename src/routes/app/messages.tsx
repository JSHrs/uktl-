import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState, PageHeader } from "@/components/app/AppLayout";
import {
  inboxFn,
  markMessageReadFn,
  communicationPreferencesFn,
  updateCommunicationPreferencesFn,
} from "@/lib/communication-functions";
export const Route = createFileRoute("/app/messages")({
  loader: async () => ({
    inbox: await inboxFn({ data: {} }),
    preferences: await communicationPreferencesFn(),
  }),
  component: Messages,
});
function Messages() {
  const data = Route.useLoaderData(),
    router = useRouter();
  const [extra, setExtra] = useState<typeof data.inbox.messages>([]),
    [cursor, setCursor] = useState(data.inbox.next),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch {
      setError("The change could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="My account"
        title="Messages"
        lede="Messages from your consultant and job-update campaigns. To reply, use the email from your consultant."
      />
      <label className="flex gap-3 items-start border border-rule rounded-lg p-4 mb-8 text-sm text-ink-soft max-w-3xl">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]"
          disabled={busy}
          checked={data.preferences.campaignsEnabled}
          onChange={(e) =>
            void act(async () => {
              await updateCommunicationPreferencesFn({
                data: { campaignsEnabled: e.target.checked },
              });
              await router.invalidate();
            })
          }
        />
        <span>
          Send me occasional job updates and recruitment campaigns. You can turn these off here at
          any time. Appointment and individual recruitment messages are separate.
        </span>
      </label>
      {error && <p role="alert" className="text-bad mb-4">{error}</p>}
      {data.inbox.messages.length === 0 && (
        <div className="max-w-3xl">
          <EmptyState title="No messages yet" body="When a consultant writes to you about a role, the message appears here as well as in your email." />
        </div>
      )}
      <div className="space-y-4 max-w-3xl">
        {[...data.inbox.messages, ...extra].map((m) => (
          <article key={m.id} className="border border-rule rounded p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-display text-2xl">{m.subject}</h2>
              {!m.read_at && (
                <button
                  disabled={busy}
                  className="underline text-sm"
                  onClick={() =>
                    void act(async () => {
                      await markMessageReadFn({ data: { id: m.id } });
                      setExtra((a) =>
                        a.map((x) => (x.id === m.id ? { ...x, read_at: Date.now() } : x)),
                      );
                      await router.invalidate();
                    })
                  }
                >
                  Mark as read
                </button>
              )}
            </div>
            <p className="text-sm text-ink-soft my-2">
              {new Date(m.created_at).toLocaleDateString("en-GB")}
              {m.job_title ? ` · ${m.job_title}` : ""}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p>
          </article>
        ))}
      </div>
      {cursor && (
        <button
          disabled={busy}
          className="mt-6 underline"
          onClick={() =>
            void act(async () => {
              const next = await inboxFn({ data: { before: cursor } });
              setExtra((a) => [...a, ...next.messages]);
              setCursor(next.next);
            })
          }
        >
          Load older messages
        </button>
      )}
    </>
  );
}
