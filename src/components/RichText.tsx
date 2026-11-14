import { Fragment } from "react";
import { boldSegments, toPlainText } from "@/lib/plain-text";

/** Ответ нейросети: **жирный** показываем жирным, остальную разметку убираем */
export default function RichText({ text }: { text: string }) {
  return (
    <>
      {boldSegments(toPlainText(text, { keepBold: true })).map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-semibold text-fg">{s.text}</strong>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}
