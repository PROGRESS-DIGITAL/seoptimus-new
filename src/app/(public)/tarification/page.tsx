import Link from "next/link";
import PlanCards from "@/components/PlanCards";
import { activePlans } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Тарифы — SEOPTIMUS" };

export default async function Pricing() {
  const plans = await activePlans();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Тарифы</h1>
      <p className="mt-2 text-slate-600">
        Оплата в кредитах: быстрая модель списывает 1 кредит за ~1000 токенов, флагманская и картинки больше.
        После регистрации 50 кредитов в подарок.
      </p>
      <div className="mt-6">
        <PlanCards
          plans={plans}
          action={() => (
            <Link href="/app/billing" className="block rounded-lg bg-indigo-600 py-2 text-center font-semibold text-white">
              Оформить
            </Link>
          )}
        />
      </div>
    </div>
  );
}
