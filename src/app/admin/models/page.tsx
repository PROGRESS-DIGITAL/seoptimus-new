import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Model } from "@/db/schema";
import { creditRub, imageCost, textCost } from "@/lib/billing";
import { MIN_MARKUP, TYPICAL_TEXT, USD_RUB, imageCostRub, textCostRub } from "@/lib/economics";
import { activePlans } from "@/lib/pricing";
import { saveModel } from "../actions";

const inp = "input-sm";
const COLS = "md:grid-cols-[100px_1fr_1fr_80px_80px_80px_60px_auto_auto_auto_50px_auto]";

function Row({ m }: { m?: Model }) {
  return (
    <form action={saveModel} className={"grid grid-cols-2 items-center gap-2 border-t border-line py-3 text-sm " + COLS}>
      <input name="slug" defaultValue={m?.slug} readOnly={!!m} placeholder="slug" className={inp} required />
      <input name="title" defaultValue={m?.title} placeholder="Название" className={inp} required />
      <input name="providerModel" defaultValue={m?.providerModel} placeholder="gpt-6-luna" className={inp} required />
      <select name="kind" defaultValue={m?.kind ?? "text"} className={inp}>
        <option value="text">текст</option>
        <option value="image">картинка</option>
      </select>
      <input name="costIn" inputMode="decimal" defaultValue={m?.costIn ?? 0} className={inp} title="Текст: USD за 1 млн входных токенов. Картинка: USD за 1 референс" />
      <input name="costOut" inputMode="decimal" defaultValue={m?.costOut ?? 0} className={inp} title="Текст: USD за 1 млн выходных токенов. Картинка: USD за 1 изображение" />
      <input name="minCredits" type="number" defaultValue={m?.minCredits ?? 1} className={inp} title="Минимум кредитов за запрос" />
      <label className="flex gap-1"><input type="checkbox" name="freeAccess" defaultChecked={m?.freeAccess} /> бесплатно</label>
      <label className="flex gap-1"><input type="checkbox" name="isDefault" defaultChecked={m?.isDefault} /> по умолч.</label>
      <label className="flex gap-1"><input type="checkbox" name="enabled" defaultChecked={m?.enabled ?? true} /> вкл</label>
      <input name="sort" type="number" defaultValue={m?.sort ?? 0} className={inp} title="Порядок" />
      <input type="hidden" name="provider" value={m?.provider ?? "openai"} />
      <button className="btn btn-sm">{m ? "Сохранить" : "Добавить"}</button>
    </form>
  );
}

const rub = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export default async function Models() {
  const [models, plans, worst] = await Promise.all([
    db.select().from(schema.models).orderBy(asc(schema.models.kind), asc(schema.models.sort)),
    activePlans(),
    creditRub(),
  ]);
  // Экономика по каждой модели: затраты, кредиты и наценка на каждом тарифе
  const econ = await Promise.all(
    models.map(async (m) => {
      const cost = m.kind === "image" ? imageCostRub(m) : textCostRub(m, TYPICAL_TEXT.tokensIn, TYPICAL_TEXT.tokensOut);
      const credits = m.kind === "image" ? await imageCost(m) : await textCost(m, TYPICAL_TEXT.tokensIn, TYPICAL_TEXT.tokensOut);
      const markups = plans.map((p) => ({ name: p.name, x: cost ? (credits * p.priceRub) / p.monthlyCredits / cost : 0 }));
      return { m, cost, credits, markups };
    }),
  );
  return (
    <div className="grid gap-6">
      <div className="card p-4">
        <h1 className="display text-xl">Модели</h1>
        <p className="mt-1 text-sm text-muted">
          Вводите нашу стоимость у провайдера в долларах. Для текста: за 1 млн входных и выходных токенов. Для картинки:
          «вход» за один референс, «выход» за одно изображение. Цена в кредитах считается сама, с наценкой не ниже
          {" "}{MIN_MARKUP} к 1 на самом выгодном для клиента тарифе. «Бесплатно»: доступна без подписки и гостям.
        </p>
        <div className={"mt-3 hidden gap-2 text-xs text-muted md:grid " + COLS}>
          <span>slug</span><span>Название</span><span>Модель у провайдера</span><span>Тип</span><span>$ вход</span><span>$ выход</span><span>Минимум</span>
        </div>
        {models.map((m) => <Row key={m.slug} m={m} />)}
        <div className="mt-4 text-sm font-semibold">Новая модель</div>
        <Row />
      </div>

      <div className="card overflow-x-auto p-4">
        <h2 className="display text-lg">Экономика</h2>
        <p className="mt-1 text-sm text-muted">
          Курс {USD_RUB} ₽ за доллар, худшая цена кредита {rub(worst)} ₽ (самый выгодный тариф или пакет). Текст считается
          как типичный: {TYPICAL_TEXT.tokensIn} токенов на вход и {TYPICAL_TEXT.tokensOut} на выход, примерно 3 000 знаков.
          Курс и наценка меняются в настройках сервера (USD_RUB, MIN_MARKUP).
        </p>
        <table className="mt-3 w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1.5">Модель</th><th>Затраты, ₽</th><th>Списываем, кр.</th>
              {plans.map((p) => <th key={p.slug}>Наценка: {p.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {econ.map(({ m, cost, credits, markups }) => (
              <tr key={m.slug}>
                <td className="py-1.5">{m.title} {m.kind === "image" ? "(картинка)" : "(текст)"}</td>
                <td>{cost ? rub(cost) : <span className="text-danger">не указаны</span>}</td>
                <td>{credits}</td>
                {markups.map((x) => (
                  <td key={x.name} className={x.x && x.x < MIN_MARKUP ? "text-danger" : "text-accent"}>
                    {x.x ? `×${x.x.toFixed(1)}` : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
