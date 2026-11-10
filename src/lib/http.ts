import { NextResponse } from "next/server";

export const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const errMessage = (e: unknown) => (e instanceof Error ? e.message : "Неизвестная ошибка");

/** Стрим текста клиенту. Ошибка посреди генерации дописывается в конец ответа. */
export function textStream(
  run: (write: (chunk: string) => void, signal: AbortSignal) => Promise<void>,
  signal: AbortSignal,
  headers: Record<string, string> = {},
) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        await run(write, signal);
      } catch (e) {
        console.error("[stream]", e);
        write(`\n\n⚠️ Ошибка генерации: ${errMessage(e)}`);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
