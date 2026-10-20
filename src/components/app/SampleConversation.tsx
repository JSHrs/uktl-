import { useState } from "react";
export function SampleConversation() {
  const [messages, setMessages] = useState([
    {
      sender: "Recruitment team",
      body: "Hello Jesse. Which roles and locations would you like to discuss?",
    },
  ]);
  const [draft, setDraft] = useState("");
  return (
    <section
      className="border border-rule rounded-xl p-5 space-y-4"
      aria-label="Sample conversation"
    >
      <p className="text-sm text-ink-soft">
        Fictional conversation, saved only until this preview closes. Nothing is sent.
      </p>
      <ol className="space-y-3">
        {messages.map((m, i) => (
          <li key={i} className="bg-paper-deep rounded p-4">
            <p className="text-xs text-ink-soft">{m.sender}</p>
            <p className="text-sm mt-2 break-words whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ol>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setMessages([...messages, { sender: "Candidate", body: draft.trim() }]);
          setDraft("");
        }}
      >
        <label className="block text-sm">
          Sample message
          <textarea
            className="mt-2 w-full bg-paper border border-rule rounded p-3"
            rows={3}
            maxLength={8000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            required
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={!draft.trim()}
            className="bg-ink text-paper rounded px-4 py-2 disabled:opacity-50"
          >
            Save sample message
          </button>
          <button
            type="button"
            className="border border-rule rounded px-4 py-2"
            onClick={() =>
              setMessages([
                ...messages,
                {
                  sender: "Recruitment team",
                  body: "Thank you. We can review the role requirements together and confirm the next steps.",
                },
              ])
            }
          >
            Simulate staff reply
          </button>
        </div>
      </form>
    </section>
  );
}
