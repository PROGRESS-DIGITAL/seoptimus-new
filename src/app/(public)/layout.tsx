import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <footer className="mt-20 border-t border-slate-200 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4">
          <span>© SEOPTIMUS · help@seoptimus.ru</span>
          <span className="flex gap-4">
            <Link href="/tarification">Тарифы</Link>
            <Link href="/user-agreement">Соглашение</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
