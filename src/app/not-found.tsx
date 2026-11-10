import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <div className="display gradient-text text-8xl">404</div>
        <p className="mt-4 text-muted">Такой страницы нет</p>
        <Link href="/" className="btn mt-8">На главную</Link>
      </div>
    </div>
  );
}
