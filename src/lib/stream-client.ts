/** Читает текстовый стрим ответа, вызывая onChunk на каждый кусок */
export async function readTextStream(
  res: Response,
  onChunk: (fullText: string) => void,
): Promise<string> {
  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      msg = (await res.json()).error ?? msg;
    } catch {}
    throw new Error(msg);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk(text);
  }
  return text;
}
