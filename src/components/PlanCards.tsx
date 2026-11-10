import { Check } from "lucide-react";
import type { Plan } from "@/db/schema";

const PERKS: Record<string, string[]> = {
  start: ["Все генераторы и чат", "Умная модель и изображения", "История всех генераций"],
  pro: ["Всё из «Старт»", "В 4 раза больше кредитов", "Хватит на ежедневную работу"],
  business: ["Всё из «Про»", "Самый большой запас кредитов", "Оплата по счёту для юрлиц"],
};

export default function PlanCards({ plans, action }: { plans: Plan[]; action?: (p: Plan) => React.ReactNode }) {
  // Подсвечиваем средний тариф
  const featured = plans[Math.min(1, plans.length - 1)]?.slug;
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((p) => {
        const hot = p.slug === featured;
        return (
          <div
            key={p.slug}
            className={
              "relative flex flex-col rounded-3xl p-7 " +
              (hot ? "glow bg-surface-2 md:-translate-y-3" : "border border-line bg-surface")
            }
          >
            {hot && (
              <span className="absolute -top-3 left-7 z-10 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-ink">
                Выбирают чаще
              </span>
            )}
            <div className="display text-lg">{p.name}</div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="display text-4xl">{p.priceRub.toLocaleString("ru-RU")}</span>
              <span className="text-muted">₽ / мес</span>
            </div>
            <div className="mt-2 text-sm font-medium text-accent">
              {p.monthlyCredits.toLocaleString("ru-RU")} кредитов каждый месяц
            </div>
            <p className="mt-3 text-sm text-muted">{p.description}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {(PERKS[p.slug] ?? []).map((perk) => (
                <li key={perk} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {perk}
                </li>
              ))}
            </ul>
            {action && <div className="mt-7">{action(p)}</div>}
          </div>
        );
      })}
    </div>
  );
}
