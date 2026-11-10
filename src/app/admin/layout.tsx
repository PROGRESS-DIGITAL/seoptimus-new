import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const link = "rounded-md px-3 py-1.5 hover:bg-slate-200";
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
          <span className="mr-4 font-extrabold text-indigo-700">SEOPTIMUS · Админка</span>
          <Link href="/admin" className={link}>Сводка</Link>
          <Link href="/admin/users" className={link}>Пользователи</Link>
          <Link href="/admin/models" className={link}>Модели</Link>
          <Link href="/admin/generators" className={link}>Генераторы</Link>
          <Link href="/admin/plans" className={link}>Тарифы</Link>
          <span className="ml-auto text-slate-500">{admin.email}</span>
          <Link href="/app" className={link}>В кабинет</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
