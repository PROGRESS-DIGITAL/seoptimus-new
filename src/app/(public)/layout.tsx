import Link from "next/link";
import Logo from "@/components/Logo";
import PublicHeader from "@/components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="relative">{children}</main>
      <footer className="mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-muted sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs">Тексты и изображения нейросетью для SEO, маркетплейсов и соцсетей.</p>
            <p className="mt-3">help@seoptimus.ru</p>
          </div>
          <div className="grid content-start gap-2">
            <div className="font-semibold text-fg">Генераторы</div>
            <Link className="hover:text-fg" href="/seo-generator">Генератор SEO-текстов</Link>
            <Link className="hover:text-fg" href="/articles-generator">Генератор статей</Link>
            <Link className="hover:text-fg" href="/text-rewriter">Рерайт текста</Link>
            <Link className="hover:text-fg" href="/text-corrector">Правка текста</Link>
            <Link className="hover:text-fg" href="/smm-generator">Посты для соцсетей</Link>
          </div>
          <div className="grid content-start gap-2">
            <div className="font-semibold text-fg">Сервис</div>
            <Link className="hover:text-fg" href="/tarification">Тарифы</Link>
            <Link className="hover:text-fg" href="/login">Вход и регистрация</Link>
            <Link className="hover:text-fg" href="/user-agreement">Пользовательское соглашение</Link>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-muted/70">© {new Date().getFullYear()} SEOPTIMUS</div>
      </footer>
    </>
  );
}
