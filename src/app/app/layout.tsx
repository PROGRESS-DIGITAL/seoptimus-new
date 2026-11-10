import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { hasActivePlan, requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/ai/gateway";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const chats = await db
    .select({ id: schema.conversations.id, title: schema.conversations.title })
    .from(schema.conversations)
    .where(eq(schema.conversations.userId, user.id))
    .orderBy(desc(schema.conversations.updatedAt))
    .limit(30);
  const link = "block rounded-md px-3 py-1.5 text-sm hover:bg-slate-200";

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">
        <Link href="/" className="px-4 py-3 text-lg font-extrabold text-indigo-700">SEOPTIMUS</Link>
        <nav className="space-y-0.5 px-2">
          <Link href="/app/chat" className={link}>💬 Новый чат</Link>
          <Link href="/app/generators" className={link}>✍️ Генераторы</Link>
          <Link href="/app/images" className={link}>🖼 Изображения</Link>
          <Link href="/app/history" className={link}>🗂 История</Link>
          <Link href="/app/billing" className={link}>💳 Тариф и оплата</Link>
          {user.role === "admin" && <Link href="/admin" className={link}>⚙️ Админка</Link>}
        </nav>
        <div className="mt-4 flex-1 overflow-y-auto px-2">
          <div className="px-3 pb-1 text-xs uppercase text-slate-400">Чаты</div>
          {chats.map((c) => (
            <Link key={c.id} href={`/app/chat?c=${c.id}`} className={link + " truncate text-slate-700"}>
              {c.title}
            </Link>
          ))}
        </div>
        <div className="border-t border-slate-200 p-4 text-sm">
          <div className="truncate text-slate-600">{user.email}</div>
          <div className="mt-1 font-semibold">{user.credits.toLocaleString("ru-RU")} кредитов</div>
          <div className="text-xs text-slate-500">
            {hasActivePlan(user)
              ? `Тариф до ${user.planUntil!.toLocaleDateString("ru-RU")}`
              : "Бесплатный доступ"}
          </div>
          <form action="/api/auth/logout" method="post" className="mt-2">
            <button className="text-xs text-slate-500 hover:underline">Выйти</button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-sm md:hidden">
          <Link href="/app/chat" className="font-bold text-indigo-700">SEOPTIMUS</Link>
          <span>{user.credits} кр.</span>
          <span className="flex gap-3">
            <Link href="/app/generators">Генераторы</Link>
            <Link href="/app/images">Картинки</Link>
          </span>
        </div>
        {isDemoMode() && (
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
            Демо-режим: ключ OpenAI не задан, ответы — заглушки
          </div>
        )}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
