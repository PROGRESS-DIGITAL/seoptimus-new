"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Копирует текст. compact: только иконка (на телефоне подпись скрыта всегда) */
export default function CopyButton({ text, className = "", compact }: { text: string; className?: string; compact?: boolean }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // старые браузеры и http без https
      const t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      title="Копировать"
      aria-label="Копировать"
      className={"chip chip-btn !py-1 !text-xs " + className}
    >
      {done ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
      {!compact && <span className="hidden sm:inline">{done ? "Скопировано" : "Копировать"}</span>}
    </button>
  );
}
