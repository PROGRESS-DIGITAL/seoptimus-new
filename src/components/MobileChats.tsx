"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageSquareText, Plus, X } from "lucide-react";

/** На телефоне: список чатов выезжает снизу, как в приложениях */
export default function MobileChats({ chats }: { chats: { id: number; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const params = useSearchParams();
  useEffect(() => setOpen(false), [path, params]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Мои чаты"
        className="grid h-11 w-11 cursor-pointer place-items-center rounded-[12px] border border-line-2 text-muted active:scale-95"
      >
        <MessageSquareText className="h-[18px] w-[18px]" />
      </button>
      <Link href="/app/chat" aria-label="Новый чат" className="btn !h-11 !min-h-11 !w-11 !p-0 !rounded-[12px]">
        <Plus className="h-4 w-4" />
      </Link>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Мои чаты">
          <button aria-label="Закрыть" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="pb-safe absolute inset-x-0 bottom-0 max-h-[75dvh] animate-rise overflow-y-auto rounded-t-3xl border-t border-line-2 bg-surface p-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-3 flex items-center justify-between">
              <div className="display text-lg">Мои чаты</div>
              <button onClick={() => setOpen(false)} aria-label="Закрыть" className="grid h-8 w-8 place-items-center rounded-full bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Link href="/app/chat" className="btn mb-3 w-full">
              <Plus className="h-4 w-4" /> Новый чат
            </Link>
            {chats.length === 0 && <p className="py-6 text-center text-sm text-muted">Чатов пока нет</p>}
            <div className="grid gap-1">
              {chats.map((c) => (
                <Link key={c.id} href={`/app/chat?c=${c.id}`} className="truncate rounded-xl px-3 py-3 text-[15px] active:bg-white/10">
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
