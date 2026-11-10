"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";
import { readTextStream } from "@/lib/stream-client";

type Msg = { role: "user" | "assistant"; content: string };
type ModelOption = { slug: string; title: string; locked: boolean };

const IDEAS = [
  "Придумай 5 заголовков для статьи про ремонт кухни",
  "Напиши продающее описание для кроссовок на Wildberries",
  "Составь контент-план для Telegram-канала кофейни на неделю",
  "Объясни простыми словами, что такое SEO",
];

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
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(preset?: string) {
    const message = (preset ?? text).trim();
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
      box.current?.focus();
    }
  }

  const empty = msgs.length === 0;

  const composer = (
    <form
      className="glow rounded-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <div className="rounded-3xl bg-surface-2 p-3">
        <textarea
          ref={box}
          autoFocus
          className="max-h-48 min-h-14 w-full resize-none bg-transparent px-2 pt-1 text-[15px] outline-none placeholder:text-muted/60"
          rows={2}
          placeholder="Спросите что угодно…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <select
            aria-label="Модель"
            className="cursor-pointer rounded-full border border-line-2 bg-white/5 px-3 py-1 text-xs text-muted outline-none hover:text-fg"
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
          <button
            disabled={busy || !text.trim()}
            aria-label="Отправить"
            className="btn !h-9 !w-9 !p-0"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );

  if (empty)
    return (
      <div className="relative grid h-full place-items-center overflow-hidden px-4">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-violet opacity-20 blur-[120px]" />
        <div className="relative w-full max-w-2xl animate-rise">
          <h1 className="display text-center text-3xl sm:text-4xl">
            Чем <span className="gradient-text">помочь</span> сегодня?
          </h1>
          <div className="mt-8">{composer}</div>
          {error && <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => send(idea)}
                className="card card-hover cursor-pointer p-3.5 text-left text-sm text-muted hover:text-fg"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-surface-2 px-5 py-3">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  {m.content ? (
                    <div className={"whitespace-pre-wrap leading-relaxed " + (busy && i === msgs.length - 1 ? "caret" : "")}>
                      {m.content}
                    </div>
                  ) : (
                    <div className="grid max-w-sm gap-2 pt-1">
                      <div className="shimmer h-3 w-full rounded-full" />
                      <div className="shimmer h-3 w-2/3 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={end} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        {error && <div className="mb-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
        {composer}
      </div>
    </div>
  );
}
