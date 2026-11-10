import type { Plan } from "@/db/schema";

export default function PlanCards({ plans, action }: { plans: Plan[]; action?: (p: Plan) => React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((p) => (
        <div key={p.slug} className="flex flex-col rounded-2xl border border-slate-200 p-6">
          <div className="text-lg font-bold">{p.name}</div>
          <div className="mt-2 text-3xl font-extrabold">
            {p.priceRub.toLocaleString("ru-RU")} ₽<span className="text-base font-normal text-slate-500">/мес</span>
          </div>
          <div className="mt-1 text-sm text-indigo-700">{p.monthlyCredits.toLocaleString("ru-RU")} кредитов в месяц</div>
          <p className="mt-3 flex-1 text-sm text-slate-600">{p.description}</p>
          {action && <div className="mt-4">{action(p)}</div>}
        </div>
      ))}
    </div>
  );
}
