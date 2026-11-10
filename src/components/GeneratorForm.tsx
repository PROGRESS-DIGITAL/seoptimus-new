"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GeneratorField } from "@/db/schema";
import { readTextStream } from "@/lib/stream-client";

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
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generator: slug, model: model || undefined, input: values }),
      });
      await readTextStream(res, setOutput);
      if (guest) setLeft((n) => Math.max(0, n - 1));
      else router.refresh(); // обновить баланс в шапке
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="grid gap-4">
        {fields.map((f) => (
          <label key={f.name} className="grid gap-1.5 text-sm font-medium text-slate-700">
            {f.label}
            {f.type === "textarea" ? (
              <textarea
                className={input + " min-h-28"}
                placeholder={f.placeholder}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            ) : f.type === "select" ? (
              <select
                className={input}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              >
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className={input}
                placeholder={f.placeholder}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
          </label>
        ))}
        {models && models.length > 1 && (
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Модель
            <select className={input} value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => (
                <option key={m.slug} value={m.slug} disabled={m.locked}>
                  {m.title}
                  {m.locked ? " (на платном тарифе)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={busy || (guest && left <= 0)}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Генерирую…" : "Сгенерировать"}
          </button>
          {guest && (
            <span className="text-sm text-slate-500">
              {left > 0 ? `Бесплатно без регистрации: осталось ${left} сегодня` : "Лимит на сегодня исчерпан."}{" "}
              <Link href="/login" className="text-indigo-600 underline">
                Регистрация даёт 50 кредитов
              </Link>
            </span>
          )}
        </div>
      </form>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {output && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>Результат · {output.length} знаков</span>
            <button
              type="button"
              className="text-indigo-600 hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <div className="whitespace-pre-wrap text-slate-900">{output}</div>
        </div>
      )}
    </div>
  );
}
