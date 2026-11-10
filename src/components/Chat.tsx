"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readTextStream } from "@/lib/stream-client";

type Msg = { role: "user" | "assistant"; content: string };
type ModelOption = { slug: string; title: string; locked: boolean };

export default function Chat({
  conversationId,
  initial,
  models,
  initialModel,
}: {
  conversationId: number | null;
  initial: Msg[];
  models: ModelOption[];
  initialModel?: string | null;
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState(initialModel ?? models.find((m) => !m.locked)?.slug ?? "");
  const [convId, setConvId] = useState(conversationId);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setError("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, model, message }),
      });
      const newId = Number(res.headers.get("X-Conversation-Id")) || null;
      await readTextStream(res, (full) =>
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full }]),
      );
      if (newId && newId !== convId) {
        setConvId(newId);
        window.history.replaceState(null, "", `/app/chat?c=${newId}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMsgs((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
        <span className="text-sm text-slate-500">Модель</span>
        <select
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.slug} value={m.slug} disabled={m.locked}>
              {m.title}
              {m.locked ? " (платный тариф)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {msgs.length === 0 && (
          <div className="mt-20 text-center text-slate-400">Спросите что угодно: текст, идею, код, перевод</div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 " +
                (m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-900")
              }
            >
              {m.content || (busy && i === msgs.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {error && <div className="mx-4 mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <form
        className="flex gap-2 border-t border-slate-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          className="min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          rows={2}
          placeholder="Сообщение… (Enter — отправить, Shift+Enter — новая строка)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button disabled={busy} className="rounded-lg bg-indigo-600 px-4 font-semibold text-white disabled:opacity-50">
          {busy ? "…" : "Отправить"}
        </button>
      </form>
    </div>
  );
}
