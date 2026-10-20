import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Conversation } from "@/components/app/Conversation";
import { conversationListFn } from "@/lib/conversation-functions";
import { AdminHeader } from "@/routes/admin";
export const Route = createFileRoute("/admin/messages")({ component: StaffMessages });
function StaffMessages() {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string>();
  const list = useQuery({
    queryKey: ["staff-conversations", query],
    queryFn: () => conversationListFn({ data: { query } }),
    retry: false,
  });
  return (
    <>
      <AdminHeader
        title="Messages"
        sub="Two-way candidate conversations. Email campaigns remain separate."
      />
      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <section>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search);
            }}
            className="flex gap-2 mb-4"
          >
            <input
              aria-label="Search candidate conversations"
              placeholder="Candidate name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
              className="min-w-0 w-full p-2 border border-rule rounded bg-paper"
            />
            <button className="underline text-sm">Search</button>
          </form>
          {list.isPending && <p role="status">Loading candidates…</p>}
          {list.error && (
            <p role="alert">
              Could not load conversations.{" "}
              <button className="underline" onClick={() => void list.refetch()}>
                Retry
              </button>
            </p>
          )}
          <p className="text-xs text-ink-soft mb-3">
            Up to 100 candidates. Search by name to narrow the list.
          </p>
          <ul className="space-y-2">
            {list.data?.map((c) => (
              <li key={c.id}>
                <button
                  aria-pressed={selected === c.id}
                  className={`w-full text-left p-3 border border-rule rounded ${selected === c.id ? "bg-paper-deep" : ""}`}
                  onClick={() => setSelected(c.id)}
                >
                  {c.name || "Candidate"}
                  <span className="block text-xs text-ink-soft mt-1">
                    {c.last_message
                      ? new Date(Number(c.last_message)).toLocaleDateString("en-GB")
                      : "No messages yet"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {list.data?.length === 0 && <p>No linked candidates match this search.</p>}
        </section>
        <div>
          {selected ? (
            <Conversation key={selected} candidateId={selected} />
          ) : (
            <p className="border border-rule rounded-xl p-8 text-ink-soft">
              Select a candidate to read or start a conversation.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
