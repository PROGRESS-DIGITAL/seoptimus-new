import { toPlainText } from "@/lib/plain-text";

/** Ответ нейросети без разметки: звёздочки, решётки и т.п. убираем и в старых сохранённых ответах */
export default function RichText({ text }: { text: string }) {
  return <>{toPlainText(text)}</>;
}
