import "server-only";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import type { Model } from "@/db/schema";
import type { ImageFormat } from "@/lib/image-formats";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type StreamResult = { text: string; tokens: number };
export type ImageRef = { data: Buffer; name: string; type: string };
export type ImageResult = { data: Buffer; ext: "png" | "svg" };

/**
 * Единый AI-шлюз. Сейчас подключён только OpenAI.
 * Claude и Perplexity добавляются новым провайдером здесь и записью модели в админке.
 */
interface Provider {
  streamChat(
    model: Model,
    messages: ChatMessage[],
    onDelta: (chunk: string) => void,
    opts?: { maxTokens?: number; signal?: AbortSignal },
  ): Promise<StreamResult>;
  /** refs: референсы, с которыми работать (правка, перенос стиля, коллаж) */
  generateImage(model: Model, prompt: string, format: ImageFormat, refs?: ImageRef[]): Promise<ImageResult>;
}

export const isDemoMode = () => !process.env.OPENAI_API_KEY;

let openaiClient: OpenAI | null = null;
const openai = () =>
  (openaiClient ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  }));

const openaiProvider: Provider = {
  async streamChat(model, messages, onDelta, opts) {
    const stream = await openai().chat.completions.create(
      {
        model: model.providerModel,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        ...(opts?.maxTokens ? { max_completion_tokens: opts.maxTokens } : {}),
      },
      { signal: opts?.signal },
    );
    let text = "";
    let tokens = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        text += delta;
        onDelta(delta);
      }
      if (chunk.usage) tokens = chunk.usage.total_tokens;
    }
    return { text, tokens: tokens || Math.ceil(text.length / 3) };
  },
  async generateImage(model, prompt, format, refs = []) {
    // Новые модели (gpt-image-2 и старше) рисуют сразу в нужном формате.
    // Старые умеют только 1:1, 3:2 и 2:3: рисуем ближайший и обрезаем по центру.
    const legacy = /^(gpt-image-1|dall-e)/.test(model.providerModel);
    const size = legacy ? nearestStandard(format) : `${format.width}x${format.height}`;
    const res = refs.length
      ? await openai().images.edit({
          model: model.providerModel,
          prompt,
          size,
          n: 1,
          image: await Promise.all(refs.map((r) => toFile(r.data, r.name, { type: r.type }))),
        })
      : await openai().images.generate({ model: model.providerModel, prompt, size, n: 1 });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("Модель не вернула изображение");
    let data = Buffer.from(b64, "base64");
    if (legacy && format.width !== format.height)
      data = await sharp(data).resize(format.width, format.height, { fit: "cover" }).png().toBuffer();
    return { data, ext: "png" };
  },
};

/** Демо-провайдер без ключа: позволяет проверить весь сценарий без расходов на API */
const demoProvider: Provider = {
  async streamChat(model, messages, onDelta) {
    const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const text =
      `Демо-режим (нейросеть не подключена), модель «${model.title}».\n\n` +
      `Здесь будет ответ нейросети на запрос:\n«${last.slice(0, 300)}${last.length > 300 ? "…" : ""}»\n\n` +
      "Настоящая генерация включится после подключения ключа API на сервере.";
    for (const word of text.split(/(\s+)/)) {
      onDelta(word);
      await new Promise((r) => setTimeout(r, 12));
    }
    return { text, tokens: Math.ceil((last.length + text.length) / 3) };
  },
  async generateImage(_model, prompt, format, refs = []) {
    const safe = prompt.replace(/[<>&"]/g, "").slice(0, 60);
    const { width: w, height: h } = format;
    const title = refs.length ? `Демо по референсу (${refs.length})` : "Демо-изображение";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="a" cx="30%" cy="25%" r="80%"><stop offset="0" stop-color="#8b5cff"/><stop offset="0.55" stop-color="#2a1a4a"/><stop offset="1" stop-color="#0f0f17"/></radialGradient><radialGradient id="b" cx="80%" cy="85%" r="50%"><stop offset="0" stop-color="#c6ff3d" stop-opacity="0.55"/><stop offset="1" stop-color="#c6ff3d" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/><text x="50%" y="47%" font-family="sans-serif" font-size="44" font-weight="700" text-anchor="middle" fill="#f5f5f8">${title}</text><text x="50%" y="54%" font-family="sans-serif" font-size="26" text-anchor="middle" fill="#c9c9d6">${safe}</text><text x="50%" y="60%" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#c6ff3d">${format.ratio}</text></svg>`;
    return { data: Buffer.from(svg), ext: "svg" };
  },
};

export function providerFor(model: Model): Provider {
  if (isDemoMode()) return demoProvider;
  switch (model.provider) {
    case "openai":
      return openaiProvider;
    default:
      throw new Error(`Провайдер ${model.provider} пока не подключён`);
  }
}

function nearestStandard(f: ImageFormat) {
  const r = f.width / f.height;
  return r > 1.15 ? "1536x1024" : r < 0.87 ? "1024x1536" : "1024x1024";
}
