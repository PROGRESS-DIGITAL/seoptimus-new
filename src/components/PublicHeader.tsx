import Link from "next/link";
import { getUser } from "@/lib/auth";
import Logo from "./Logo";

export default async function PublicHeader() {
  const user = await getUser();
  const link = "hidden rounded-full px-3 py-1.5 text-muted transition hover:bg-white/5 hover:text-fg md:inline";
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/seo-generator" className={link}>SEO-тексты</Link>
          <Link href="/articles-generator" className={link}>Статьи</Link>
          <Link href="/text-rewriter" className={link}>Рерайт</Link>
          <Link href="/smm-generator" className={link}>Посты</Link>
          <Link href="/tarification" className={link.replace("hidden ", "").replace(" md:inline", "")}>Тарифы</Link>
          <Link href={user ? "/app" : "/login"} className="btn btn-sm ml-2">
            {user ? "В кабинет" : "Войти"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
