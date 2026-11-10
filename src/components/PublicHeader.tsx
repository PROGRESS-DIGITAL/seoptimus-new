import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function PublicHeader() {
  const user = await getUser();
  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-indigo-700">
          SEOPTIMUS
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/seo-generator" className="hidden hover:text-indigo-600 sm:inline">SEO</Link>
          <Link href="/articles-generator" className="hidden hover:text-indigo-600 sm:inline">Статьи</Link>
          <Link href="/text-rewriter" className="hidden hover:text-indigo-600 sm:inline">Рерайт</Link>
          <Link href="/tarification" className="hover:text-indigo-600">Тарифы</Link>
          <Link
            href={user ? "/app" : "/login"}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
          >
            {user ? "Кабинет" : "Войти"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
