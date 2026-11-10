import "server-only";
import OpenAI from "openai";
import type { Model } from "@/db/schema";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type StreamResult = { text: string; tokens: number };

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
  generateImage(model: Model, prompt: string, size: string): Promise<Buffer>;
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
  async generateImage(model, prompt, size) {
    const res = await openai().images.generate({
      model: model.providerModel,
      prompt,
      size: size as "1024x1024",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("Модель не вернула изображение");
    return Buffer.from(b64, "base64");
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
  async generateImage(_model, prompt) {
    const safe = prompt.replace(/[<>&"]/g, "").slice(0, 60);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><radialGradient id="a" cx="30%" cy="25%" r="80%"><stop offset="0" stop-color="#8b5cff"/><stop offset="0.55" stop-color="#2a1a4a"/><stop offset="1" stop-color="#0f0f17"/></radialGradient><radialGradient id="b" cx="80%" cy="85%" r="50%"><stop offset="0" stop-color="#c6ff3d" stop-opacity="0.55"/><stop offset="1" stop-color="#c6ff3d" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/><text x="50%" y="47%" font-family="sans-serif" font-size="44" font-weight="700" text-anchor="middle" fill="#f5f5f8">Демо-изображение</text><text x="50%" y="54%" font-family="sans-serif" font-size="26" text-anchor="middle" fill="#c9c9d6">${safe}</text></svg>`;
    return Buffer.from(svg);
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
