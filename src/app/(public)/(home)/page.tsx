import Link from "next/link";
import { ArrowRight, Gift, History, ImageIcon, MessagesSquare, Zap } from "lucide-react";
import Aurora from "@/components/Aurora";
import GeneratorCard from "@/components/GeneratorCard";
import HeroGenerators, { type HeroTab } from "@/components/HeroGenerators";
import PlanCards from "@/components/PlanCards";
import { getUser } from "@/lib/auth";
import { enabledGenerators } from "@/lib/generators";
import { guestRemaining } from "@/lib/guest";
import { activePlans } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const FORMATS = [
  "Статьи", "SEO-тексты", "Title и Description", "Рерайт", "Посты для соцсетей", "Карточки товаров",
  "Коммерческие предложения", "Письма", "Ответы на отзывы", "Контент-планы", "Технические задания", "Переводы",
];

/** Вкладки генератора на первом экране: короткое имя, заголовок и подсказка */
const HERO_TABS: Omit<HeroTab, "fields">[] = [
  { slug: "text", tab: "Текст", title: "Генератор текста", hint: "Статьи, письма, КП, отзывы и ещё десяток форматов" },
  { slug: "seo", tab: "SEO", title: "Генератор SEO", hint: "Title, Description, H1 и SEO-тексты по ключевым словам" },
  { slug: "correct", tab: "Правка", title: "Правка текста", hint: "Исправит орфографию, пунктуацию и стилистику" },
  { slug: "rewrite", tab: "Рерайт", title: "Рерайт текста", hint: "Перескажет своими словами с сохранением смысла и объёма" },
  { slug: "smm", tab: "Соцсети", title: "Контент для соцсетей", hint: "Пост для ВКонтакте, Telegram, Дзена нужной длины" },
];

const STEPS = [
  { n: "01", title: "Опишите задачу", text: "Тема, формат и пара уточнений. Никаких сложных промптов." },
  { n: "02", title: "Нейросеть пишет", text: "Текст появляется на глазах, обычно быстрее чем за минуту." },
  { n: "03", title: "Забирайте результат", text: "Копируйте, правьте в чате или генерируйте заново." },
];

export default async function Home() {
  const [user, all, plans] = await Promise.all([getUser(), enabledGenerators(), activePlans()]);
  const tabs: HeroTab[] = HERO_TABS.flatMap((t) => {
    const g = all.find((x) => x.slug === t.slug);
    return g ? [{ ...t, fields: g.fields }] : [];
  });
  const remaining = user ? 0 : await guestRemaining();
  const cabinet = user ? "/app" : "/login";

  return (
    <>
      {/* Первый экран */}
      <section className="relative overflow-hidden">
        <Aurora />
        {/* Левая часть стоит на месте, когда окно генерации растёт вниз */}
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 pb-16 pt-14 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
          <div className="animate-rise">
            <span className="chip">
              <Gift className="h-3.5 w-3.5 text-accent" />
              Бесплатно и без регистрации
            </span>
            <h1 className="display mt-6 text-[2.08rem] leading-[1.08] sm:text-[3rem]">
              Нейросеть <span className="gradient-text">пишет текст</span> онлайн&nbsp;— быстро и&nbsp;без&nbsp;VPN
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Статьи, SEO-тексты, рерайт, посты и описания товаров за минуту. Работает в браузере,
              оплата российской картой.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#try" className="btn btn-lg max-sm:w-full">
                Попробовать сейчас <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/tarification" className="btn-ghost btn-lg max-sm:w-full">Тарифы</Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                [String(all.length), "генераторов"],
                ["< 1 мин", "на текст"],
                ["490 ₽", "тариф от"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="display text-2xl text-fg">{v}</dt>
                  <dd className="mt-1 text-sm text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div id="try" className="glow animate-rise min-w-0 scroll-mt-24 rounded-3xl [animation-delay:120ms]">
            <div className="glass p-5 sm:p-7">
              {tabs.length > 0 ? (
                <HeroGenerators tabs={tabs} guest={!user} guestRemaining={remaining} />
              ) : (
                <p className="text-muted">Генератор временно недоступен</p>
              )}
            </div>
          </div>
        </div>

        {/* Бегущая строка форматов */}
        <div className="relative border-y border-line bg-white/[0.02] py-4 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {[...FORMATS, ...FORMATS].map((f, i) => (
              <span key={i} className="chip whitespace-nowrap">
                <span className="text-accent">✦</span> {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Генераторы */}
        <section className="pt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium uppercase tracking-widest text-accent">Генераторы</div>
              <h2 className="display mt-3 text-3xl sm:text-4xl">Готовые инструменты под задачу</h2>
            </div>
            <p className="max-w-sm text-muted">Форма вместо промпта: заполнили пару полей и получили текст в нужном формате.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {all.map((g, i) => (
              <GeneratorCard
                key={g.slug}
                slug={g.slug}
                title={g.title}
                description={g.description}
                href={g.publicPath ?? (user ? `/app/generators/${g.slug}` : "/login")}
                big={i === 0}
              />
            ))}
          </div>
        </section>

        {/* Кабинет */}
        <section className="pt-24">
          <div className="text-sm font-medium uppercase tracking-widest text-accent">Личный кабинет</div>
          <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">Больше, чем генератор текста</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="card relative overflow-hidden p-7 lg:col-span-2">
              <MessagesSquare className="h-6 w-6 text-accent" />
              <h3 className="display mt-4 text-xl">Чат с нейросетью</h3>
              <p className="mt-2 max-w-md text-muted">
                Свободный диалог с памятью: уточняйте, просите переписать, продолжайте с того же места.
              </p>
              {/* Мини-макет чата */}
              <div className="mt-7 grid gap-3 text-sm">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 font-medium text-accent-ink">
                  Придумай 3 заголовка для статьи про кофемашины в офис
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3 leading-relaxed">
                  1. Кофемашина в офис: как выбрать и не переплатить
                  <br />
                  2. Пять причин поставить кофемашину на работе
                  <br />
                  3. Офисный кофе без очередей: гид по кофемашинам<span className="caret" />
                </div>
              </div>
              <div aria-hidden className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet opacity-20 blur-[90px]" />
            </div>
            <div className="grid gap-4">
              <div className="card relative overflow-hidden p-7">
                <ImageIcon className="h-6 w-6 text-accent" />
                <h3 className="display mt-4 text-xl">Изображения</h3>
                <p className="mt-2 text-muted">Картинки по описанию для постов, статей и карточек товаров.</p>
                <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink opacity-20 blur-[70px]" />
              </div>
              <div className="card relative overflow-hidden p-7">
                <History className="h-6 w-6 text-accent" />
                <h3 className="display mt-4 text-xl">История</h3>
                <p className="mt-2 text-muted">Все тексты и картинки сохраняются, ничего не потеряется.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Как это работает */}
        <section className="pt-24">
          <h2 className="display text-3xl sm:text-4xl">Три шага до готового текста</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-7">
                <div className="display gradient-text text-4xl">{s.n}</div>
                <div className="mt-5 text-lg font-semibold">{s.title}</div>
                <p className="mt-2 text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Тарифы */}
        <section className="pt-24">
          <div className="text-center">
            <div className="text-sm font-medium uppercase tracking-widest text-accent">Тарифы</div>
            <h2 className="display mt-3 text-3xl sm:text-4xl">Три тарифа, одна понятная валюта</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Единая валюта, кредиты: тратятся на тексты, чат и картинки. После регистрации 50 кредитов в подарок.
            </p>
          </div>
          <div className="mt-14">
            <PlanCards
              plans={plans}
              action={() => (
                <Link href={user ? "/app/billing" : "/login"} className="btn btn-lg w-full">Выбрать</Link>
              )}
            />
          </div>
        </section>

        {/* Призыв */}
        <section className="pt-24">
          <div className="glow relative overflow-hidden rounded-[2rem] bg-surface-2 px-6 py-14 text-center sm:px-12">
            <div aria-hidden className="absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-15 blur-[100px]" />
            <Zap className="mx-auto h-8 w-8 text-accent" />
            <h2 className="display mx-auto mt-5 max-w-2xl text-3xl sm:text-4xl">Первый текст будет готов через минуту</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">Регистрация по коду из письма, без паролей. 50 кредитов сразу на счёт.</p>
            <Link href={cabinet} className="btn btn-lg mt-8">
              {user ? "Открыть кабинет" : "Начать бесплатно"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
