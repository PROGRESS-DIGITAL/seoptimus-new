import type { GeneratorField } from "@/db/schema";

/** Подставляет поля в шаблон. Строки с незаполненными полями убираются, чтобы не сбивать нейросеть */
export function renderTemplate(template: string, values: Record<string, string>) {
  const EMPTY = "\u0000";
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, k) => (values[k] ?? "").trim() || EMPTY)
    .split("\n")
    .filter((line) => !line.includes(EMPTY))
    .join("\n")
    .trim();
}

export function validateInput(fields: GeneratorField[], input: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const v = typeof input[field.name] === "string" ? (input[field.name] as string).slice(0, 20000) : "";
    if (field.required && !v.trim()) throw new Error(`Заполните поле «${field.label}»`);
    if (field.type === "checkbox" && v && v !== "Да" && v !== "Нет") throw new Error(`Неверное значение поля «${field.label}»`);
    if (field.type === "select" && v && field.options && !field.options.includes(v))
      throw new Error(`Недопустимое значение поля «${field.label}»`);
    out[field.name] = v;
  }
  return out;
}
