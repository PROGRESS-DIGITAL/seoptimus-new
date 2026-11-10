import Link from "next/link";
import { enabledGenerators } from "@/lib/generators";

export default async function Generators() {
  const all = await enabledGenerators();
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Генераторы</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((g) => (
          <Link key={g.slug} href={`/app/generators/${g.slug}`} className="rounded-xl border border-slate-200 p-5 hover:border-indigo-400">
            <div className="font-semibold">{g.title}</div>
            <div className="mt-1 text-sm text-slate-600">{g.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
