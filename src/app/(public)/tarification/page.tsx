import Link from "next/link";
import Aurora from "@/components/Aurora";
import PlanCards from "@/components/PlanCards";
import { getUser } from "@/lib/auth";
import { activePlans } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Тарифы — SEOPTIMUS" };

const FAQ = [
  ["Что такое кредиты?", "Единая валюта сервиса. Быстрая модель тратит 1 кредит примерно за 1000 токенов (это около 2–3 тысяч знаков текста), умная модель и изображения стоят дороже."],
  ["Можно ли попробовать бесплатно?", "Да. Несколько генераций в день доступны без регистрации, а после регистрации на счёт приходит 50 кредитов."],
  ["Как отменить подписку?", "В кабинете, в разделе «Тариф и оплата», одной кнопкой. Оплаченный период останется активным до конца."],
  ["Сгорают ли кредиты?", "Кредиты из разовых пакетов не сгорают. Кредиты тарифа начисляются при каждой оплате."],
];

export default async function Pricing() {
  const [plans, user] = await Promise.all([activePlans(), getUser()]);
  return (
    <div className="relative overflow-hidden">
      <Aurora subtle />
      <div className="mx-auto max-w-6xl px-4 pt-16">
        <div className="text-center">
          <h1 className="display text-4xl sm:text-5xl">
            Тарифы <span className="gradient-text">без путаницы</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Три тарифа и одна валюта. Кредиты тратятся на тексты, чат и изображения.
          </p>
        </div>
        <div className="mt-16">
          <PlanCards
            plans={plans}
            action={() => (
              <Link href={user ? "/app/billing" : "/login"} className="btn w-full">Оформить</Link>
            )}
          />
        </div>
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="display text-2xl">Частые вопросы</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q}
                  <span className="text-2xl leading-none text-accent transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
