"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ModelOption = { slug: string; title: string; locked: boolean; price: number };

export default function ImageStudio({ models, recent }: { models: ModelOption[]; recent: string[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [model, setModel] = useState(models.find((m) => !m.locked)?.slug ?? models[0]?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(recent);
  const current = models.find((m) => m.slug === model);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImages((i) => [json.url, ...i]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const input = "rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500";
  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="grid gap-3">
        <textarea
          className={input + " min-h-24"}
          placeholder="Опишите изображение: что, где, в каком стиле"
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <select className={input} value={model} onChange={(e) => setModel(e.target.value)}>
            {models.map((m) => (
              <option key={m.slug} value={m.slug} disabled={m.locked}>
                {m.title}
                {m.locked ? " (платный тариф)" : ""}
              </option>
            ))}
          </select>
          <select className={input} value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="1024x1024">Квадрат 1:1</option>
            <option value="1536x1024">Горизонтально 3:2</option>
            <option value="1024x1536">Вертикально 2:3</option>
          </select>
          <button
            disabled={busy || !current || current.locked}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Рисую… (до минуты)" : `Создать · ${current?.price ?? 0} кр.`}
          </button>
        </div>
      </form>
      {current?.locked && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Генерация изображений доступна на платных тарифах. <Link className="underline" href="/app/billing">Выбрать тариф</Link>
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((src) => (
          <a key={src} href={src} target="_blank" className="block overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="aspect-square w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}
