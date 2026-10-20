import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationFn, sendConversationFn } from "@/lib/conversation-functions";
export function Conversation({ candidateId }: { candidateId?: string }) {
  const [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const q = useInfiniteQuery({
    initialPageParam: undefined as {time:number;id:string}|undefined,
    queryKey: ["conversation", candidateId ?? "mine"],
    queryFn: ({pageParam}) => conversationFn({ data: { candidateId,before:pageParam } }),
    getNextPageParam:(last)=>last.next,
    refetchInterval: 30000,
    retry: false,
  });
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendConversationFn({ data: { candidateId, id: requestId, body: draft } });
      setDraft("");
      setRequestId(crypto.randomUUID());
      await q.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Message could not be sent. Your draft is kept.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="border border-rule rounded-xl p-4 sm:p-6 mb-8"
      aria-label="Consultant conversation"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-semibold">Consultant conversation</h2>
        <button
          className="underline text-sm"
          disabled={q.isFetching}
          onClick={() => void q.refetch()}
        >
          Refresh messages
        </button>
      </div>
      <p className="text-sm text-ink-soft mt-2">
        Private in-app messages. Updates every 30 seconds while this page is open. No email is sent.
      </p>
      {q.isPending ? (
        <p role="status" className="my-5">
          Loading conversation…
        </p>
      ) : q.error ? (
        <p role="alert" className="my-5">
          {q.error.message}
        </p>
      ) : (
        <>
          <ol className="space-y-3 my-5 max-h-[420px] overflow-y-auto">
            {q.data?.pages.slice().reverse().flatMap(p=>p.messages).map((m) => (
              <li
                key={m.id}
                className={`rounded-lg p-4 ${m.sender_kind === "staff" ? "bg-paper-deep" : "border border-rule"}`}
              >
                <p className="text-xs text-ink-soft">
                  {m.sender_kind === "staff" ? "Recruitment team" : "Candidate"} ·{" "}
                  {new Date(m.created_at).toLocaleString("en-GB")}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>
              </li>
            ))}
          </ol>
          {q.data?.pages[0].messages.length === 0 && (
            <p className="my-5 text-sm">Start a conversation with the recruitment team.</p>
          )}
          {q.hasNextPage && (
            <button className="text-sm underline mb-4" disabled={q.isFetchingNextPage} onClick={()=>void q.fetchNextPage()}>Load older messages</button>
          )}
          <form onSubmit={send} className="space-y-3">
            <label className="block text-sm">
              Message
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setRequestId(crypto.randomUUID());
                }}
                maxLength={8000}
                required
                disabled={busy}
                rows={3}
                className="block w-full mt-2 p-3 rounded border border-rule bg-paper"
              />
            </label>
            <button
              disabled={busy || !draft.trim()}
              className="bg-ink text-paper rounded px-5 py-2.5 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
