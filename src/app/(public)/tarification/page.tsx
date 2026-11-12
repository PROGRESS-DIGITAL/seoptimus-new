import Link from "next/link";
import Aurora from "@/components/Aurora";
import PlanCards from "@/components/PlanCards";
import { getUser } from "@/lib/auth";
import { Check, Minus } from "lucide-react";
import { planPricing } from "@/lib/plan-features";
import { activePlans } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Тарифы — SEOPTIMUS" };

const FAQ = [
  ["Что такое кредиты?", "Единая валюта сервиса. Быстрая модель тратит 1 кредит примерно за 1000 токенов (это около 2–3 тысяч знаков текста), умная модель и изображения стоят дороже. Сколько стоит каждое действие, видно в таблице выше."],
  ["Почему количество текстов указано примерно?", "Списание зависит от длины: короткий Title стоит меньше, длинная статья больше. Мы считали по среднему ответу около 3 000 знаков."],
  ["Можно ли попробовать бесплатно?", "Да. Несколько генераций в день доступны без регистрации, а после регистрации на счёт приходит 50 кредитов."],
  ["Как отменить подписку?", "В кабинете, в разделе «Тариф и оплата», одной кнопкой. Оплаченный период останется активным до конца."],
  ["Сгорают ли кредиты?", "Нет. Неиспользованные кредиты остаются на счёте и переходят на следующий месяц. Если подписка закончится, остаток можно тратить на быструю модель."],
  ["Можно ли купить кредиты без подписки?", "Да, в кабинете есть разовые пакеты. Но умная модель и изображения открываются только с тарифом."],
];

export default async function Pricing() {
  const [plans, user, { costs }] = await Promise.all([activePlans(), getUser(), planPricing()]);
  const fmt = (n: number) => n.toLocaleString("ru-RU");
  // Сравнение: бесплатный доступ и платные тарифы
  const rows: [string, React.ReactNode, React.ReactNode][] = [
    ["Кредиты", "50 при регистрации, без входа 3 текста в день", plans.map((p) => `${p.name}: ${fmt(p.monthlyCredits)}`).join(" · ") + " в месяц"],
    ["Генераторы и чат", true, true],
    ["Быстрая модель", true, true],
    ["Умная модель", false, true],
    ["Изображения и правка по фото", false, true],
    ["История и копирование", true, true],
    ["Приложение на телефон", true, true],
  ];
  const mark = (v: React.ReactNode) =>
    v === true ? <Check className="h-5 w-5 text-accent" /> : v === false ? <Minus className="h-5 w-5 text-muted/50" /> : v;
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
              <Link href={user ? "/app/billing" : "/login"} className="btn btn-lg w-full">Оформить</Link>
            )}
          />
        </div>
        <div className="mx-auto mt-24 max-w-4xl">
          <h2 className="display text-2xl">Бесплатно и по тарифу</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-white/[0.03] text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Возможность</th>
                  <th className="px-5 py-3.5 font-medium">Бесплатно</th>
                  <th className="px-5 py-3.5 font-medium text-accent">Любой тариф</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(([name, free, paid]) => (
                  <tr key={name}>
                    <td className="px-5 py-3.5 font-medium">{name}</td>
                    <td className="px-5 py-3.5 text-muted">{mark(free)}</td>
                    <td className="px-5 py-3.5">{mark(paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="display mt-16 text-2xl">Сколько стоит действие</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Текст быстрой моделью", `около ${costs.fast} кр.`, "1 кредит за 1000 токенов"],
              ["Текст умной моделью", `около ${costs.smart} кр.`, "дороже, но пишет сильнее"],
              ["Изображение", `${costs.image} кр.`, "одна картинка за запрос"],
            ].map(([t, v, h]) => (
              <div key={t} className="card p-5">
                <div className="text-sm text-muted">{t}</div>
                <div className="display mt-2 text-2xl">{v}</div>
                <div className="mt-1 text-xs text-muted/80">{h}</div>
              </div>
            ))}
          </div>
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
