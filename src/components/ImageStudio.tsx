"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ImageIcon, ImagePlus, Lock, Wand2, X } from "lucide-react";
import AutoTextarea from "@/components/AutoTextarea";
import { IMAGE_FORMATS, MAX_REF_BYTES, MAX_REFS } from "@/lib/image-formats";

type ModelOption = { slug: string; title: string; locked: boolean; price: number };
export type StudioImage = { url: string; ratio: string };
type Ref = { file: File; preview: string };

const STYLES = ["Фотореализм", "3D-рендер", "Минимализм", "Акварель", "Неон", "Плоская иллюстрация"];
const REF_IDEAS = ["Убери фон", "Сделай в стиле аниме", "Добавь надпись «Скидка 30%»", "Помести товар на мраморный стол"];

/** Значок формата: прямоугольник нужных пропорций */
function RatioIcon({ ratio }: { ratio: string }) {
  const [w, h] = ratio.split(":").map(Number);
  const k = 16 / Math.max(w, h);
  return <span className="rounded-[3px] border border-current" style={{ width: w * k, height: h * k }} />;
}

export default function ImageStudio({ models, recent }: { models: ModelOption[]; recent: StudioImage[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<string>("1:1");
  const [refs, setRefs] = useState<Ref[]>([]);
  const [drag, setDrag] = useState(false);
  const [model, setModel] = useState(models.find((m) => !m.locked)?.slug ?? models[0]?.slug ?? "");
  const [busy, setBusy] = useState(false);
  // Секундомер на заготовке картинки, чтобы было видно, что работа идёт
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);
  const [error, setError] = useState("");
  const [images, setImages] = useState<StudioImage[]>(recent);
  const current = models.find((m) => m.slug === model);
  const withRefs = refs.length > 0;

  useEffect(() => () => refs.forEach((r) => URL.revokeObjectURL(r.preview)), [refs]);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    setError("");
    const next = [...refs];
    for (const file of Array.from(list)) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        setError("Подойдут JPG, PNG или WEBP");
        continue;
      }
      if (file.size > MAX_REF_BYTES) {
        setError("Файл больше 10 МБ");
        continue;
      }
      if (next.length >= MAX_REFS) {
        setError(`Можно до ${MAX_REFS} референсов`);
        break;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setRefs(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("prompt", prompt);
      body.set("ratio", ratio);
      body.set("model", model);
      refs.forEach((r) => body.append("refs", r.file));
      const res = await fetch("/api/images", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImages((i) => [{ url: json.url, ratio: json.ratio }, ...i]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const aspect = (r: string) => r.replace(":", " / ");

  return (
    <div className="grid gap-8">
      <form
        onSubmit={submit}
        className={"glow rounded-3xl transition " + (drag ? "scale-[1.01]" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className={"rounded-3xl bg-surface-2 p-4 sm:p-5 " + (drag ? "ring-2 ring-accent/60" : "")}>
          {withRefs && (
            <div className="mb-3 flex flex-wrap gap-2">
              {refs.map((r, i) => (
                <div key={r.preview} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-line-2 sm:h-20 sm:w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Убрать референс"
                    onClick={() => setRefs(refs.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-black/70 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {refs.length < MAX_REFS && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="grid h-16 w-16 cursor-pointer place-items-center rounded-xl border border-dashed border-line-2 text-muted transition hover:border-accent/60 hover:text-accent sm:h-20 sm:w-20"
                  aria-label="Добавить ещё референс"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          <AutoTextarea
            maxVh={40}
            className="min-h-24 w-full bg-transparent text-[15px] outline-none placeholder:text-muted/60"
            placeholder={
              withRefs
                ? "Что хотите сделать с изображением? Например: убери фон и добавь мягкую тень"
                : "Опишите изображение: что на нём, где, в каком стиле…"
            }
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 pb-4">
            {(withRefs ? REF_IDEAS : STYLES).map((s) => (
              <button
                key={s}
                type="button"
                className="chip chip-btn !text-xs"
                onClick={() =>
                  setPrompt((p) => (withRefs ? (p.trim() ? `${p.trim()}. ${s}` : s) : p.trim() ? `${p.trim()}, ${s.toLowerCase()}` : s))
                }
              >
                + {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {!withRefs && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="chip chip-btn !py-1.5 !text-xs"
                  title="Загрузить фото, с которым работать"
                >
                  <ImagePlus className="h-4 w-4" /> Референс
                </button>
              )}
              <div className="-mx-1 flex max-w-full overflow-x-auto px-1">
                <div className="flex rounded-full border border-line-2 p-0.5">
                  {IMAGE_FORMATS.map((f) => (
                    <button
                      key={f.ratio}
                      type="button"
                      title={f.hint}
                      onClick={() => setRatio(f.ratio)}
                      className={
                        "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition " +
                        (ratio === f.ratio ? "bg-white/15 text-fg" : "text-muted hover:text-fg")
                      }
                    >
                      <RatioIcon ratio={f.ratio} />
                      {f.ratio}
                    </button>
                  ))}
                </div>
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
            <button disabled={busy || !current || current.locked} aria-busy={busy} className={"btn max-sm:w-full " + (busy ? "is-loading" : "")}>
              <Wand2 className={"h-4 w-4 " + (busy ? "animate-pulse" : "")} />
              {busy ? "Рисую…" : `${withRefs ? "Изменить" : "Создать"} · ${current?.price ?? 0} кр.`}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted/70">
            {IMAGE_FORMATS.find((f) => f.ratio === ratio)?.hint} · одно изображение за запрос
            {withRefs ? "" : " · можно перетащить сюда фото"}
          </p>
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
        <div className="columns-2 gap-3 sm:gap-4 md:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
          {busy && (
            <div className="gen-placeholder grid w-full break-inside-avoid place-items-center rounded-2xl" style={{ aspectRatio: aspect(ratio) }}>
              <div className="relative z-10 grid justify-items-center gap-2 rounded-2xl bg-bg/70 px-4 py-3 text-center text-sm backdrop-blur">
                <Wand2 className="h-5 w-5 animate-pulse text-accent" />
                <span className="font-medium text-fg">Рисую изображение…</span>
                <span className="text-xs text-muted">{elapsed} с · обычно до минуты</span>
              </div>
            </div>
          )}
          {images.map((img) => (
            <div key={img.url} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full object-cover" style={{ aspectRatio: aspect(img.ratio) }} />
              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                <span className="chip !bg-black/60 !text-white !border-white/20 !py-0.5 !text-[11px] backdrop-blur">{img.ratio}</span>
                <a
                  href={img.url}
                  download
                  aria-label="Скачать"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:text-accent"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
