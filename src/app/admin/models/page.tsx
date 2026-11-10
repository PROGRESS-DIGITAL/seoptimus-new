import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Model } from "@/db/schema";
import { saveModel } from "../actions";

const inp = "rounded border border-slate-300 px-2 py-1 text-sm";

function Row({ m }: { m?: Model }) {
  return (
    <form action={saveModel} className="grid grid-cols-2 items-center gap-2 border-t border-slate-100 py-3 text-sm md:grid-cols-[110px_1fr_1fr_80px_70px_70px_auto_auto_auto_60px_auto]">
      <input name="slug" defaultValue={m?.slug} readOnly={!!m} placeholder="slug" className={inp} required />
      <input name="title" defaultValue={m?.title} placeholder="Название" className={inp} required />
      <input name="providerModel" defaultValue={m?.providerModel} placeholder="gpt-5-mini" className={inp} required />
      <select name="kind" defaultValue={m?.kind ?? "text"} className={inp}>
        <option value="text">текст</option>
        <option value="image">картинка</option>
      </select>
      <input name="creditPrice" type="number" defaultValue={m?.creditPrice ?? 1} className={inp} title="Кредитов за 1000 токенов или за картинку" />
      <input name="minCredits" type="number" defaultValue={m?.minCredits ?? 1} className={inp} title="Минимум за запрос" />
      <label className="flex gap-1"><input type="checkbox" name="freeAccess" defaultChecked={m?.freeAccess} /> бесплатно</label>
      <label className="flex gap-1"><input type="checkbox" name="isDefault" defaultChecked={m?.isDefault} /> по умолч.</label>
      <label className="flex gap-1"><input type="checkbox" name="enabled" defaultChecked={m?.enabled ?? true} /> вкл</label>
      <input name="sort" type="number" defaultValue={m?.sort ?? 0} className={inp} title="Порядок" />
      <input type="hidden" name="provider" value={m?.provider ?? "openai"} />
      <button className="rounded bg-indigo-600 px-3 py-1 text-white">{m ? "Сохранить" : "Добавить"}</button>
    </form>
  );
}

export default async function Models() {
  const models = await db.select().from(schema.models).orderBy(asc(schema.models.kind), asc(schema.models.sort));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h1 className="text-xl font-bold">Модели</h1>
      <p className="mt-1 text-sm text-slate-500">
        Цена: для текста кредиты за 1000 токенов (вход + выход), для картинок кредиты за изображение.
        «Бесплатно» — доступна без подписки и гостям. Провайдер сейчас только OpenAI.
      </p>
      <div className="mt-3 hidden grid-cols-[110px_1fr_1fr_80px_70px_70px_auto_auto_auto_60px_auto] gap-2 text-xs text-slate-500 md:grid">
        <span>slug</span><span>Название</span><span>Модель OpenAI</span><span>Тип</span><span>Цена</span><span>Минимум</span>
      </div>
      {models.map((m) => <Row key={m.slug} m={m} />)}
      <div className="mt-4 text-sm font-semibold">Новая модель</div>
      <Row />
    </div>
  );
}
