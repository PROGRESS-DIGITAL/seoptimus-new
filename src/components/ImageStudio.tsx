"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageIcon, Lock, Wand2 } from "lucide-react";

type ModelOption = { slug: string; title: string; locked: boolean; price: number };

const SIZES = [
  { value: "1024x1024", label: "1:1", box: "h-4 w-4" },
  { value: "1536x1024", label: "3:2", box: "h-3.5 w-5" },
  { value: "1024x1536", label: "2:3", box: "h-5 w-3.5" },
];

const STYLES = ["Фотореализм", "3D-рендер", "Минимализм", "Акварель", "Неон", "Плоская иллюстрация"];

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

  return (
    <div className="grid gap-8">
      <form onSubmit={submit} className="glow rounded-3xl">
        <div className="rounded-3xl bg-surface-2 p-4 sm:p-5">
          <textarea
            className="min-h-24 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted/60"
            placeholder="Опишите изображение: что на нём, где, в каком стиле…"
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 pb-4">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className="chip chip-btn !text-xs"
                onClick={() => setPrompt((p) => (p.trim() ? `${p.trim()}, ${s.toLowerCase()}` : s))}
              >
                + {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-line-2 p-0.5">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSize(s.value)}
                    className={
                      "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs transition " +
                      (size === s.value ? "bg-white/15 text-fg" : "text-muted hover:text-fg")
                    }
                  >
                    <span className={"rounded-[3px] border border-current " + s.box} />
                    {s.label}
                  </button>
                ))}
              </div>
              {models.length > 1 && (
                <select
                  className="cursor-pointer rounded-full border border-line-2 bg-white/5 px-3 py-1.5 text-xs text-muted outline-none"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m.slug} value={m.slug} disabled={m.locked}>{m.title}</option>
                  ))}
                </select>
              )}
            </div>
            <button disabled={busy || !current || current.locked} className="btn">
              <Wand2 className={"h-4 w-4 " + (busy ? "animate-pulse" : "")} />
              {busy ? "Рисую…" : `Создать · ${current?.price ?? 0} кр.`}
            </button>
          </div>
        </div>
      </form>

      {current?.locked && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <Lock className="h-4 w-4 text-accent" />
          Генерация изображений доступна на платных тарифах.
          <Link className="btn btn-sm ml-auto" href="/app/billing">Выбрать тариф</Link>
        </div>
      )}
      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      {images.length === 0 && !busy ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-line-2 py-20 text-center text-muted">
          <ImageIcon className="h-8 w-8" />
          <p className="mt-3">Здесь появятся ваши изображения</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {busy && <div className="shimmer aspect-square rounded-2xl" />}
          {images.map((src) => (
            <a
              key={src}
              href={src}
              target="_blank"
              className="group block overflow-hidden rounded-2xl border border-line transition hover:border-accent/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
