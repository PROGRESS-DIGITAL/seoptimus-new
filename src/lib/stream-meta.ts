/**
 * Служебный хвост текстового стрима: после ответа сервер дописывает
 * разделитель и JSON (подсказки, id генерации). Клиент отрезает его от текста.
 */
export const META_SEP = "\u001e";

/** text: итоговый текст после чистки «хвостов», заменяет то, что пришло стримом */
export type StreamMeta = { suggestions?: string[]; generationId?: number; text?: string };

export function splitMeta(full: string): { text: string; meta: StreamMeta | null } {
  const i = full.indexOf(META_SEP);
  if (i < 0) return { text: full, meta: null };
  let meta: StreamMeta | null = null;
  try {
    meta = JSON.parse(full.slice(i + 1));
  } catch {
    // хвост ещё не дошёл целиком
  }
  return { text: full.slice(0, i), meta };
}
