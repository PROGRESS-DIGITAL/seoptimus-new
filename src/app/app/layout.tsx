import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { LogOut, Plus } from "lucide-react";
import { db, schema } from "@/db";
import { Suspense } from "react";
import type { Metadata } from "next";
import { BottomNav, SideNav } from "@/components/AppNav";
import InstallHint from "@/components/InstallHint";
import MobileChats from "@/components/MobileChats";
import Logo from "@/components/Logo";
import { hasActivePlan, requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/ai/gateway";

export const dynamic = "force-dynamic";
// Кабинет закрыт от поисковиков
export const metadata: Metadata = { title: "Кабинет — SEOPTIMUS", robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const chats = await db
    .select({ id: schema.conversations.id, title: schema.conversations.title })
    .from(schema.conversations)
    .where(eq(schema.conversations.userId, user.id))
    .orderBy(desc(schema.conversations.updatedAt))
    .limit(30);
  const active = hasActivePlan(user);

  return (
    <div className="app-shell flex h-dvh bg-bg">
      <aside className="hidden w-[272px] shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 py-4">
          <Logo href="/app/chat" />
        </div>
        <div className="px-3 pb-3">
          <Link href="/app/chat" className="btn btn-sm w-full">
            <Plus className="h-4 w-4" /> Новый чат
          </Link>
        </div>
        <SideNav admin={user.role === "admin"} />
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3">
          {chats.length > 0 && <div className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted/60">Недавние чаты</div>}
          {chats.map((c) => (
            <Link
              key={c.id}
              href={`/app/chat?c=${c.id}`}
              className="block truncate rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-fg"
            >
              {c.title}
            </Link>
          ))}
        </div>
        <div className="m-3 rounded-2xl border border-line bg-white/[0.03] p-4">
          <div className="flex items-baseline justify-between">
            <span className="display text-2xl">{user.credits.toLocaleString("ru-RU")}</span>
            <span className="text-xs text-muted">кредитов</span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {active ? `Тариф до ${user.planUntil!.toLocaleDateString("ru-RU")}` : "Бесплатный доступ"}
          </div>
          <Link href="/app/billing" className="btn-ghost btn-sm mt-3 w-full">
            {active ? "Пополнить" : "Выбрать тариф"}
          </Link>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
            <span className="truncate">{user.email}</span>
            <form action="/api/auth/logout" method="post">
              <button title="Выйти" className="cursor-pointer hover:text-fg">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="pt-safe border-b border-line bg-bg/90 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2 px-4 py-2">
            <Logo href="/app/chat" className="mr-auto" />
            <Link href="/app/billing" className="chip !py-1.5">
              <span className="font-semibold text-fg">{user.credits.toLocaleString("ru-RU")}</span> кр.
            </Link>
            <Suspense>
              <MobileChats chats={chats} />
            </Suspense>
          </div>
        </div>
        <InstallHint />
        {isDemoMode() && (
          <div className="border-b border-line bg-accent/10 px-4 py-1.5 text-center text-xs text-accent">
            Демо-режим: нейросеть не подключена, ответы показаны для примера
          </div>
        )}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
