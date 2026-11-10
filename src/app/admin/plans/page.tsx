import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Plan } from "@/db/schema";
import { savePlan } from "../actions";

const inp = "input-sm";

function Row({ p }: { p?: Plan }) {
  return (
    <form action={savePlan} className="grid grid-cols-2 items-center gap-2 border-t border-line py-3 md:grid-cols-[100px_140px_90px_100px_1fr_60px_auto_auto]">
      <input name="slug" defaultValue={p?.slug} readOnly={!!p} placeholder="slug" required className={inp} />
      <input name="name" defaultValue={p?.name} placeholder="Название" required className={inp} />
      <input name="priceRub" type="number" defaultValue={p?.priceRub} placeholder="₽/мес" className={inp} />
      <input name="monthlyCredits" type="number" defaultValue={p?.monthlyCredits} placeholder="кредитов" className={inp} />
      <input name="description" defaultValue={p?.description} placeholder="Описание" className={inp} />
      <input name="sort" type="number" defaultValue={p?.sort ?? 0} className={inp} />
      <label className="flex gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> активен</label>
      <button className="btn btn-sm">{p ? "Сохранить" : "Добавить"}</button>
    </form>
  );
}

export default async function Plans() {
  const plans = await db.select().from(schema.plans).orderBy(asc(schema.plans.sort));
  return (
    <div className="card p-4">
      <h1 className="display text-xl">Тарифы</h1>
      <p className="mt-1 text-sm text-muted">Цена в рублях за месяц и сколько кредитов начисляется при каждой оплате.</p>
      {plans.map((p) => <Row key={p.slug} p={p} />)}
      <div className="mt-4 text-sm font-semibold">Новый тариф</div>
      <Row />
    </div>
  );
}
