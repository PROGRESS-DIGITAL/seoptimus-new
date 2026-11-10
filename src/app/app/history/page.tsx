import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export default async function History() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(schema.generations)
    .where(eq(schema.generations.userId, user.id))
    .orderBy(desc(schema.generations.id))
    .limit(100);
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">История генераций</h1>
      {rows.length === 0 && <p className="mt-4 text-slate-500">Пока пусто</p>}
      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <details key={r.id} className="rounded-xl border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm">
              <span className="font-semibold">{r.kind === "image" ? "Изображение" : r.generatorSlug}</span>
              <span className="text-slate-500">
                {" · "}{r.createdAt.toLocaleString("ru-RU")} · {r.modelSlug} · {r.credits} кр.
              </span>
              <div className="mt-1 truncate text-slate-600">{Object.values(r.input).join(" · ")}</div>
            </summary>
            {r.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.output} alt="" className="mt-3 max-w-sm rounded-lg" />
            ) : (
              <div className="mt-3 whitespace-pre-wrap text-sm">{r.output}</div>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
