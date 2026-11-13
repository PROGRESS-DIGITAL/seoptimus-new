"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";
import AutoTextarea from "@/components/AutoTextarea";
import CopyButton from "@/components/CopyButton";
import Suggestions from "@/components/Suggestions";
import { readTextStream } from "@/lib/stream-client";
import { META_SEP, splitMeta } from "@/lib/stream-meta";

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
  fromGeneration,
  autoSend,
}: {
  conversationId: number | null;
  initial: Msg[];
  models: ModelOption[];
  initialModel?: string | null;
  /** Чат начинается с результата генератора */
  fromGeneration?: number;
  /** Сразу отправить это сообщение (вариант продолжения из генератора) */
  autoSend?: string;
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState(initialModel ?? models.find((m) => !m.locked)?.slug ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [waitingTips, setWaitingTips] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);
  const convIdRef = useRef(conversationId);

  // На ПК сразу ставим курсор в поле, на телефоне не открываем клавиатуру сама по себе
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) box.current?.focus();
  }, []);

  // Лента едет вниз вместе с печатающимся ответом, пока человек сам не прокрутил её вверх
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs, suggestions, waitingTips]);

  // Один экземпляр на все чаты: сбрасываемся, только когда открыли другой чат.
  // Обновление страницы после первого сообщения (тот же чат) состояние не трогает.
  const seen = useRef<{ conv: number | null; gen?: number; q?: string } | null>(null);
  useEffect(() => {
    const prev = seen.current;
    seen.current = { conv: conversationId, gen: fromGeneration, q: autoSend };
    const sameChat =
      prev &&
      (conversationId === convIdRef.current ||
        (conversationId === null && convIdRef.current === null && prev.gen === fromGeneration && prev.q === autoSend));
    if (prev && sameChat) return;
    if (prev) {
      setMsgs(initial);
      convIdRef.current = conversationId;
      setSuggestions([]);
      setError("");
      if (initialModel) setModel(initialModel);
    }
    if (autoSend && !started.current) {
      started.current = true;
      send(autoSend, conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, fromGeneration, autoSend]);

  async function send(preset?: string, forConv: number | null = convIdRef.current) {
    const message = (preset ?? text).trim();
    if (!message || busy) return;
    setText("");
    setError("");
    setBusy(true);
    setSuggestions([]);
    stick.current = true; // своё сообщение всегда показываем внизу
    setMsgs((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: forConv, model, message, fromGeneration: forConv ? undefined : fromGeneration }),
      });
      const newId = Number(res.headers.get("X-Conversation-Id")) || null;
      let tips: string[] = [];
      await readTextStream(res, (full) => {
        const { text: answer, meta } = splitMeta(full);
        // Текст закончился, сервер подбирает варианты продолжения
        setWaitingTips(full.length > 0 && !meta && full.includes(META_SEP));
        if (meta?.suggestions) tips = meta.suggestions;
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: answer }]);
      });
      setWaitingTips(false);
      setSuggestions(tips);
      if (newId && newId !== forConv) {
        convIdRef.current = newId;
        window.history.replaceState(null, "", `/app/chat?c=${newId}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMsgs((m) => m.slice(0, -1));
    } finally {
      setWaitingTips(false);
      setBusy(false);
      if (window.matchMedia("(min-width: 768px)").matches) box.current?.focus();
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
        <AutoTextarea
          ref={box}
          maxVh={40}
          className="min-h-14 w-full bg-transparent px-2 pt-1 text-[15px] outline-none placeholder:text-muted/60"
          rows={2}
          placeholder="Спросите что угодно…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // На телефоне Enter переносит строку, отправка кнопкой
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
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
            className="btn !h-11 !min-h-11 !w-11 !p-0 !rounded-[12px]"
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
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
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
                    <>
                      <div className={"whitespace-pre-wrap leading-relaxed " + (busy && i === msgs.length - 1 && !waitingTips ? "caret" : "")}>
                        {m.content}
                      </div>
                      {!(busy && i === msgs.length - 1) && (
                        <div className="mt-2.5 flex">
                          <CopyButton text={m.content} compact className="!h-8 !w-8 !justify-center !p-0" />
                        </div>
                      )}
                    </>
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
          {(waitingTips || suggestions.length > 0) && (
            <div className="pl-[46px]">
              <Suggestions items={suggestions} loading={waitingTips} onPick={(s) => send(s)} />
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-4 sm:pb-4">
        {error && <div className="mb-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
        {composer}
      </div>
    </div>
  );
}
