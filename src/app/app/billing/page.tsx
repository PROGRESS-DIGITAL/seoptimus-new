import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import PayButton from "@/components/PayButton";
import PlanCards from "@/components/PlanCards";
import { hasActivePlan, requireUser } from "@/lib/auth";
import { activePlans } from "@/lib/pricing";
import { cancelAutopay } from "./actions";

const PACKS = [
  { credits: 500, price: 290 },
  { credits: 2000, price: 990 },
];

const REASONS: Record<string, string> = {
  signup_bonus: "Бонус за регистрацию",
  plan_payment: "Оплата тарифа",
  credits_pack: "Пакет кредитов",
  generate: "Генератор",
  chat: "Чат",
  image: "Изображение",
  refund_image: "Возврат за изображение",
  admin: "Начисление администратором",
};

export default async function Billing() {
  const user = await requireUser();
  const [plans, ledger] = await Promise.all([
    activePlans(),
    db.select().from(schema.ledger).where(eq(schema.ledger.userId, user.id)).orderBy(desc(schema.ledger.id)).limit(50),
  ]);
  const publicId = process.env.CLOUDPAYMENTS_PUBLIC_ID ?? "";
  const active = hasActivePlan(user);
  const current = plans.find((p) => p.slug === user.planSlug);

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <section>
        <h1 className="text-2xl font-bold">Тариф и оплата</h1>
        <div className="mt-3 rounded-xl border border-slate-200 p-5">
          <div className="text-3xl font-extrabold">{user.credits.toLocaleString("ru-RU")} кредитов</div>
          <div className="mt-1 text-slate-600">
            {active
              ? `Тариф «${current?.name ?? user.planSlug}» оплачен до ${user.planUntil!.toLocaleDateString("ru-RU")}`
              : "Подписки нет, доступны бесплатные модели"}
          </div>
          {active && (
            <form action={cancelAutopay} className="mt-3">
              <button className="text-sm text-slate-500 underline">Отключить автопродление</button>
            </form>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Подписка</h2>
        <div className="mt-4">
          <PlanCards
            plans={plans}
            action={(p) => (
              <PayButton
                publicId={publicId}
                email={user.email}
                amount={p.priceRub}
                description={`Подписка SEOPTIMUS «${p.name}» на 1 месяц`}
                data={{ plan: p.slug }}
                recurrent
                label={`Оплатить ${p.priceRub} ₽`}
              />
            )}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Пакеты кредитов без подписки</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PACKS.map((pk) => (
            <div key={pk.credits} className="rounded-xl border border-slate-200 p-5">
              <div className="text-lg font-bold">{pk.credits.toLocaleString("ru-RU")} кредитов</div>
              <div className="mb-3 text-slate-600">{pk.price} ₽, не сгорают</div>
              <PayButton
                publicId={publicId}
                email={user.email}
                amount={pk.price}
                description={`Пакет ${pk.credits} кредитов SEOPTIMUS`}
                data={{ credits: pk.credits }}
                label="Купить"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">История операций</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {ledger.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="py-1.5 text-slate-500">{l.createdAt.toLocaleString("ru-RU")}</td>
                <td>{REASONS[l.reason] ?? l.reason}</td>
                <td className={"text-right font-medium " + (l.delta > 0 ? "text-green-700" : "")}>
                  {l.delta > 0 ? "+" : ""}
                  {l.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
