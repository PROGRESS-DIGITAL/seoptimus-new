import { Check, ImageIcon, Sparkles, Zap } from "lucide-react";
import type { Plan } from "@/db/schema";
import { PLAN_EXTRA, PLAN_FEATURES, planPricing } from "@/lib/plan-features";

export default async function PlanCards({ plans, action }: { plans: Plan[]; action?: (p: Plan) => React.ReactNode }) {
  const { estimate } = await planPricing();
  // Подсвечиваем средний тариф
  const featured = plans[Math.min(1, plans.length - 1)]?.slug;
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((p) => {
        const hot = p.slug === featured;
        const e = estimate(p.monthlyCredits);
        const fmt = (n: number) => n.toLocaleString("ru-RU");
        return (
          <div
            key={p.slug}
            className={
              "relative flex flex-col rounded-3xl p-6 " +
              (hot ? "glow bg-surface-2 md:-translate-y-3" : "border border-line bg-surface")
            }
          >
            {hot && (
              <span className="absolute -top-3 left-7 z-10 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-ink">
                Выбирают чаще
              </span>
            )}
            <div className="display text-lg">{p.name}</div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="display text-4xl">{fmt(p.priceRub)}</span>
              <span className="text-muted">₽ / мес</span>
            </div>
            <div className="mt-1.5 text-sm font-medium text-accent">{fmt(p.monthlyCredits)} кредитов каждый месяц</div>
            <p className="mt-2 text-sm text-muted">{p.description}</p>

            <div className="mt-4 rounded-2xl border border-line bg-white/[0.03] px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wider text-muted">Хватит примерно на · кредиты общие</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {e.fast > 0 && (
                  <li className="flex items-center gap-2.5">
                    <Zap className="h-4 w-4 shrink-0 text-accent" />
                    <span><b className="font-semibold">{fmt(e.fast)}</b> текстов быстрой моделью</span>
                  </li>
                )}
                {e.smart > 0 && (
                  <li className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                    <span>или <b className="font-semibold">{fmt(e.smart)}</b> текстов умной</span>
                  </li>
                )}
                {e.images > 0 && (
                  <li className="flex items-center gap-2.5">
                    <ImageIcon className="h-4 w-4 shrink-0 text-accent" />
                    <span>или <b className="font-semibold">{fmt(e.images)}</b> изображений</span>
                  </li>
                )}
              </ul>
            </div>

            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {[...(PLAN_EXTRA[p.slug] ?? []), ...PLAN_FEATURES].map((perk, i) => (
                <li key={perk} className={"flex gap-2.5 " + (i < (PLAN_EXTRA[p.slug]?.length ?? 0) ? "font-medium text-fg" : "")}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {perk}
                </li>
              ))}
            </ul>
            {action && <div className="mt-5">{action(p)}</div>}
          </div>
        );
      })}
    </div>
  );
}
