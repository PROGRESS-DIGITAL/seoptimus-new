import Link from "next/link";
import GeneratorForm from "@/components/GeneratorForm";
import PlanCards from "@/components/PlanCards";
import { getUser } from "@/lib/auth";
import { enabledGenerators, generatorBySlug } from "@/lib/generators";
import { guestRemaining } from "@/lib/guest";
import { activePlans } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, main, all, plans] = await Promise.all([
    getUser(),
    generatorBySlug("text"),
    enabledGenerators(),
    activePlans(),
  ]);
  const remaining = user ? 0 : await guestRemaining();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-10 py-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Нейросеть пишет текст онлайн бесплатно
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Статьи, SEO-тексты, рерайт, посты и описания товаров за минуту. Работает в браузере, без VPN и зарубежных карт. Первые генерации без регистрации.
          </p>
          <ul className="mt-6 space-y-2 text-slate-700">
            <li>✓ {all.length} готовых генераторов под задачи SEO, SMM и маркетплейсов</li>
            <li>✓ Чат с нейросетью и генерация изображений в личном кабинете</li>
            <li>✓ Оплата картой РФ и СБП, от 490 ₽ в месяц</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
          {main ? (
            <GeneratorForm
              slug={main.slug}
              fields={main.fields}
              guest={!user}
              guestRemaining={remaining}
            />
          ) : (
            <p>Генератор недоступен</p>
          )}
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-2xl font-bold">Генераторы</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((g) => (
            <Link
              key={g.slug}
              href={g.publicPath ?? (user ? `/app/generators/${g.slug}` : "/login")}
              className="rounded-xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-sm"
            >
              <div className="font-semibold">{g.title}</div>
              <div className="mt-1 text-sm text-slate-600">{g.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-2xl font-bold">Тарифы</h2>
        <div className="mt-5">
          <PlanCards plans={plans} />
        </div>
      </section>
    </div>
  );
}
