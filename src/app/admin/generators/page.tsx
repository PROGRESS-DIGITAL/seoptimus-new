import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

export default async function Generators() {
  const all = await db.select().from(schema.generators).orderBy(asc(schema.generators.sort));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Генераторы</h1>
        <Link href="/admin/generators/new" className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">Добавить</Link>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr><th>Название</th><th>SEO-адрес</th><th>Гости</th><th>Статус</th></tr>
        </thead>
        <tbody>
          {all.map((g) => (
            <tr key={g.slug} className="border-t border-slate-100">
              <td className="py-2"><Link className="text-indigo-700 hover:underline" href={`/admin/generators/${g.slug}`}>{g.title}</Link></td>
              <td>{g.publicPath ?? "—"}</td>
              <td>{g.guestAllowed ? "да" : "нет"}</td>
              <td>{g.enabled ? "включён" : "выключен"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
