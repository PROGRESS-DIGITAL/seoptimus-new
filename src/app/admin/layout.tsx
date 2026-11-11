import Link from "next/link";
import Logo from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Админка — SEOPTIMUS", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const link = "rounded-full px-3 py-1.5 text-muted transition hover:bg-white/5 hover:text-fg";
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2.5 text-sm">
          <Logo href="/admin" className="mr-2" />
          <span className="chip mr-3 !py-0.5 !text-xs">Админка</span>
          <Link href="/admin" className={link}>Сводка</Link>
          <Link href="/admin/users" className={link}>Пользователи</Link>
          <Link href="/admin/models" className={link}>Модели</Link>
          <Link href="/admin/generators" className={link}>Генераторы</Link>
          <Link href="/admin/plans" className={link}>Тарифы</Link>
          <span className="ml-auto hidden text-muted sm:inline">{admin.email}</span>
          <Link href="/app" className="btn-ghost btn-sm ml-2">В кабинет</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
