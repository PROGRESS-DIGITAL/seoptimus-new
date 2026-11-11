"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import AutoTextarea from "@/components/AutoTextarea";
import CopyButton from "@/components/CopyButton";
import Suggestions from "@/components/Suggestions";
import type { GeneratorField } from "@/db/schema";
import { readTextStream } from "@/lib/stream-client";
import { META_SEP, splitMeta, type StreamMeta } from "@/lib/stream-meta";

type ModelOption = { slug: string; title: string; locked: boolean };

export default function GeneratorForm({
  slug,
  fields,
  models,
  guest,
  guestRemaining,
}: {
  slug: string;
  fields: GeneratorField[];
  models?: ModelOption[];
  guest?: boolean;
  guestRemaining?: number;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.type === "select" ? f.options?.[0] ?? "" : ""])),
  );
  const [model, setModel] = useState(models?.find((m) => !m.locked)?.slug ?? "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(guestRemaining ?? 0);
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const [waitingTips, setWaitingTips] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOutput("");
    setMeta(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generator: slug, model: model || undefined, input: values }),
      });
      await readTextStream(res, (full) => {
        const { text, meta } = splitMeta(full);
        setOutput(text);
        setWaitingTips(!meta && full.includes(META_SEP));
        if (meta) setMeta(meta);
      });
      if (guest) setLeft((n) => Math.max(0, n - 1));
      else router.refresh(); // обновить баланс в шапке
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWaitingTips(false);
      setBusy(false);
    }
  }

  /** Вариант продолжения: дальше работаем с текстом в чате */
  function continueWith(s: string) {
    if (guest || !meta?.generationId) {
      router.push("/login");
      return;
    }
    router.push(`/app/chat?gen=${meta.generationId}&q=${encodeURIComponent(s)}`);
  }

  const set = (name: string, v: string) => setValues({ ...values, [name]: v });

  return (
    <div className="grid gap-5">
      <form onSubmit={submit} className="grid gap-4">
        {fields.map((f) => (
          <label key={f.name} className="label">
            {f.label}
            {f.type === "textarea" ? (
              <AutoTextarea
                maxVh={55}
                className="input min-h-28"
                placeholder={f.placeholder}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : f.type === "select" ? (
              <select className="input" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="input"
                placeholder={f.placeholder}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </label>
        ))}
        {models && models.length > 1 && (
          <label className="label">
            Модель
            <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => (
                <option key={m.slug} value={m.slug} disabled={m.locked}>
                  {m.title}
                  {m.locked ? " (на платном тарифе)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button disabled={busy || (guest && left <= 0)} className="btn">
            <Sparkles className={"h-4 w-4 " + (busy ? "animate-spin" : "")} />
            {busy ? "Пишу…" : "Сгенерировать"}
          </button>
          {guest && (
            <span className="text-sm text-muted">
              {left > 0 ? (
                <>Бесплатно, без регистрации · осталось {left} сегодня</>
              ) : (
                <>
                  Лимит на сегодня исчерпан.{" "}
                  <Link href="/login" className="text-accent underline-offset-4 hover:underline">
                    Получить 50 кредитов за регистрацию
                  </Link>
                </>
              )}
            </span>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>
      )}

      {busy && !output && (
        <div className="grid gap-2.5 rounded-2xl border border-line bg-black/30 p-5">
          <div className="shimmer h-3.5 w-11/12 rounded-full" />
          <div className="shimmer h-3.5 w-full rounded-full" />
          <div className="shimmer h-3.5 w-8/12 rounded-full" />
        </div>
      )}

      {output && (
        <div className="animate-rise rounded-2xl border border-line bg-black/30 p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-muted">
            <span>Результат · {output.length.toLocaleString("ru-RU")} знаков</span>
            {!busy && <CopyButton text={output} />}
          </div>
          <div className={"whitespace-pre-wrap leading-relaxed " + (busy && !waitingTips ? "caret" : "")}>{output}</div>
          {(waitingTips || (meta?.suggestions?.length ?? 0) > 0) && (
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-2.5 text-xs text-muted">
                Продолжить{guest ? " в чате после входа" : " в чате"}:
              </div>
              <Suggestions items={meta?.suggestions ?? []} loading={waitingTips} onPick={continueWith} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
