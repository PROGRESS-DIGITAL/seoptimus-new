import { desc, ilike } from "drizzle-orm";
import { db, schema } from "@/db";
import { adjustUser } from "../actions";

const inp = "rounded border border-slate-300 px-2 py-1 text-sm";

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? "";
  const [users, plans] = await Promise.all([
    db
      .select()
      .from(schema.users)
      .where(q ? ilike(schema.users.email, `%${q}%`) : undefined)
      .orderBy(desc(schema.users.id))
      .limit(100),
    db.select().from(schema.plans),
  ]);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Пользователи</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Поиск по email" className={inp} />
          <button className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Найти</button>
        </form>
      </div>
      <div className="mt-4 space-y-2">
        {users.map((u) => (
          <form key={u.id} action={adjustUser} className="grid grid-cols-2 items-center gap-2 border-t border-slate-100 pt-2 text-sm md:grid-cols-[1fr_80px_90px_120px_140px_90px_auto_auto]">
            <input type="hidden" name="id" value={u.id} />
            <div className="truncate">
              <div className="font-medium">{u.email}</div>
              <div className="text-xs text-slate-500">с {u.createdAt.toLocaleDateString("ru-RU")}</div>
            </div>
            <div title="Баланс">{u.credits} кр.</div>
            <input name="delta" type="number" placeholder="± кредиты" className={inp} />
            <select name="planSlug" defaultValue={u.planSlug ?? ""} className={inp}>
              <option value="">без тарифа</option>
              {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
            <input name="planUntil" type="date" defaultValue={u.planUntil?.toISOString().slice(0, 10) ?? ""} className={inp} />
            <select name="role" defaultValue={u.role} className={inp}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <label className="flex gap-1"><input type="checkbox" name="blocked" defaultChecked={u.blocked} /> блок</label>
            <button className="rounded bg-indigo-600 px-3 py-1 text-white">Сохранить</button>
          </form>
        ))}
      </div>
    </div>
  );
}
