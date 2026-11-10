import { desc, eq } from "drizzle-orm";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { db, schema } from "@/db";
import PageHead from "@/components/PageHead";
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
    <div className="mx-auto max-w-5xl space-y-14 p-6 sm:p-10">
      <section>
        <PageHead title="Тариф и оплата" />
        <div className="glow relative overflow-hidden rounded-3xl bg-surface-2 p-7 sm:p-9">
          <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent opacity-15 blur-[90px]" />
          <div className="text-sm text-muted">Баланс</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="display gradient-text text-5xl sm:text-6xl">{user.credits.toLocaleString("ru-RU")}</span>
            <span className="text-muted">кредитов</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="chip">
              <span className={"h-2 w-2 rounded-full " + (active ? "bg-accent" : "bg-muted")} />
              {active
                ? `Тариф «${current?.name ?? user.planSlug}» до ${user.planUntil!.toLocaleDateString("ru-RU")}`
                : "Без подписки: доступна быстрая модель"}
            </span>
            {active && (
              <form action={cancelAutopay}>
                <button className="cursor-pointer text-muted underline-offset-4 hover:text-fg hover:underline">
                  Отключить автопродление
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="display mb-8 text-xl">Подписка</h2>
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
              label={`Оплатить ${p.priceRub.toLocaleString("ru-RU")} ₽`}
            />
          )}
        />
      </section>

      <section>
        <h2 className="display mb-5 text-xl">Пакеты кредитов без подписки</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PACKS.map((pk) => (
            <div key={pk.credits} className="card flex items-center justify-between gap-4 p-6">
              <div>
                <div className="display text-xl">{pk.credits.toLocaleString("ru-RU")} кредитов</div>
                <div className="mt-1 text-sm text-muted">{pk.price} ₽ · не сгорают</div>
              </div>
              <div className="w-32">
                <PayButton
                  publicId={publicId}
                  email={user.email}
                  amount={pk.price}
                  description={`Пакет ${pk.credits} кредитов SEOPTIMUS`}
                  data={{ credits: pk.credits }}
                  label="Купить"
                  primary={false}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display mb-5 text-xl">История операций</h2>
        <div className="card divide-y divide-line">
          {ledger.length === 0 && <div className="p-5 text-muted">Операций пока нет</div>}
          {ledger.map((l) => (
            <div key={l.id} className="flex items-center gap-3.5 px-5 py-3 text-sm">
              <span className={"grid h-8 w-8 place-items-center rounded-full " + (l.delta > 0 ? "bg-accent/15 text-accent" : "bg-white/5 text-muted")}>
                {l.delta > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </span>
              <div className="flex-1">
                <div>{REASONS[l.reason] ?? l.reason}</div>
                <div className="text-xs text-muted">{l.createdAt.toLocaleString("ru-RU")}</div>
              </div>
              <div className={"font-semibold tabular-nums " + (l.delta > 0 ? "text-accent" : "")}>
                {l.delta > 0 ? "+" : ""}
                {l.delta}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
