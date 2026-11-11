"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void> };

/** Подсказка «Установить приложение» на телефоне. Скрывается навсегда после закрытия. */
export default function InstallHint() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("install-hint") === "no";
    } catch {}
    if (standalone || dismissed || window.innerWidth >= 768) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;
  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem("install-hint", "no");
    } catch {}
  };

  return (
    <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5 text-sm md:hidden">
      <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="font-medium">Установите приложение</div>
        <div className="text-xs text-muted">
          {ios ? (
            <>
              Нажмите <Share className="inline h-3 w-3" /> и «На экран Домой»
            </>
          ) : (
            "Открывается с экрана телефона, как обычное"
          )}
        </div>
      </div>
      {event && (
        <button
          className="btn btn-sm"
          onClick={async () => {
            await event.prompt();
            close();
          }}
        >
          <Download className="h-3.5 w-3.5" /> Установить
        </button>
      )}
      <button onClick={close} aria-label="Скрыть" className="p-1 text-muted">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
