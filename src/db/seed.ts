/**
 * Начальные данные: тарифы, модели, генераторы.
 * Запуск: npm run db:seed. Повторный запуск не затирает правки из админки.
 */
import { db, schema } from "./index";
import type { GeneratorField } from "./schema";

const SYSTEM_BASE =
  "Ты опытный русскоязычный копирайтер и SEO-специалист. Пиши грамотно, живым языком, без воды и канцелярита. " +
  "Не используй markdown-разметку, если об этом не просят. Не добавляй пояснений от себя: выдавай только готовый результат.";

const plans: (typeof schema.plans.$inferInsert)[] = [
  { slug: "start", name: "Старт", priceRub: 490, monthlyCredits: 1000, sort: 1,
    description: "Для личных задач: тексты, чат и немного картинок" },
  { slug: "pro", name: "Про", priceRub: 1490, monthlyCredits: 4000, sort: 2,
    description: "Для тех, кто пишет каждый день: копирайтеры, SEO, маркетологи" },
  { slug: "business", name: "Бизнес", priceRub: 4990, monthlyCredits: 15000, sort: 3,
    description: "Для отделов и агентств с большим объёмом контента" },
];

const models: (typeof schema.models.$inferInsert)[] = [
  { slug: "gpt-fast", title: "Быстрая", providerModel: "gpt-6-luna", kind: "text",
    creditPrice: 1, minCredits: 1, freeAccess: true, isDefault: true, sort: 1 },
  { slug: "gpt-flagship", title: "Умная", providerModel: "gpt-6.1-sol", kind: "text",
    creditPrice: 5, minCredits: 3, freeAccess: false, sort: 2 },
  { slug: "gpt-image", title: "Изображения", providerModel: "gpt-image-2", kind: "image",
    creditPrice: 20, minCredits: 20, freeAccess: false, sort: 10 },
];

const f = (
  name: string,
  label: string,
  type: GeneratorField["type"],
  extra: Partial<GeneratorField> = {},
): GeneratorField => ({ name, label, type, ...extra });

const generators: (typeof schema.generators.$inferInsert)[] = [
  {
    slug: "text",
    title: "Генератор текста",
    description: "Статья, письмо, отзыв, КП, ТЗ и ещё десяток форматов по короткому описанию",
    publicPath: null,
    sort: 1,
    fields: [
      f("format", "Что написать", "select", {
        options: ["Статья", "Пост", "Письмо", "Коммерческое предложение", "Техническое задание",
          "Отзыв", "Ответ на отзыв", "Контент-план", "История", "Доклад", "Чек-лист", "Перевод на английский"],
        required: true,
      }),
      f("topic", "Тема или задача", "textarea", { placeholder: "Например: преимущества кофемашины для офиса", required: true }),
      f("length", "Объём", "select", { options: ["Коротко (до 500 знаков)", "Средне (1000–1500 знаков)", "Подробно (2000+ знаков)"] }),
    ],
    systemPrompt: SYSTEM_BASE,
    promptTemplate: "Напиши: {{format}}.\nТема: {{topic}}\nОбъём: {{length}}",
  },
  {
    slug: "seo",
    title: "Генератор SEO",
    description: "Title, Description, H1 и SEO-текст по ключевым словам",
    publicPath: "/seo-generator",
    seoTitle: "Генератор SEO-текстов онлайн нейросетью — SEOPTIMUS",
    seoDescription: "Нейросеть напишет Title, Description, H1 и SEO-текст по вашим ключевым словам. Попробуйте бесплатно без регистрации.",
    sort: 2,
    fields: [
      f("what", "Что сгенерировать", "select", {
        options: ["Title (до 70 знаков)", "Description (до 160 знаков)", "H1", "SEO-текст 1000 знаков",
          "SEO-текст 2000 знаков", "Текст для карточки товара", "Ключевые слова"],
        required: true,
      }),
      f("topic", "Страница, товар или услуга", "textarea", { placeholder: "Например: доставка цветов в Москве", required: true }),
      f("keywords", "Ключевые слова", "text", { placeholder: "через запятую" }),
    ],
    systemPrompt: SYSTEM_BASE + " Ты учитываешь требования Яндекса и Google: естественное вхождение ключей, без переспама.",
    promptTemplate:
      "Сгенерируй: {{what}}.\nО чём страница: {{topic}}\nКлючевые слова (используй естественно): {{keywords}}",
  },
  {
    slug: "article",
    title: "Генератор статей",
    description: "Структурированная статья с подзаголовками по теме",
    publicPath: "/articles-generator",
    seoTitle: "Генератор статей онлайн — нейросеть пишет статьи | SEOPTIMUS",
    seoDescription: "Нейросеть напишет статью на любую тему за минуту: структура, подзаголовки, выводы. Бесплатно без регистрации.",
    sort: 3,
    fields: [
      f("topic", "Тема статьи", "text", { required: true }),
      f("audience", "Для кого", "text", { placeholder: "Например: владельцы малого бизнеса" }),
      f("length", "Объём", "select", { options: ["2000 знаков", "4000 знаков", "6000 знаков"] }),
    ],
    systemPrompt: SYSTEM_BASE + " Статьи структурируешь подзаголовками, в конце даёшь короткий вывод.",
    promptTemplate: "Напиши статью на тему «{{topic}}».\nЦелевая аудитория: {{audience}}\nОбъём: около {{length}}.",
  },
  {
    slug: "rewrite",
    title: "Рерайт текста",
    description: "Перепишет текст своими словами с сохранением смысла",
    publicPath: "/text-rewriter",
    seoTitle: "Рерайт текста онлайн нейросетью — SEOPTIMUS",
    seoDescription: "Уникальный рерайт текста нейросетью с сохранением смысла. Бесплатно без регистрации.",
    sort: 4,
    fields: [
      f("source", "Исходный текст", "textarea", { required: true }),
      f("style", "Стиль", "select", { options: ["Как в оригинале", "Проще", "Официальнее", "Продающий"] }),
    ],
    systemPrompt: SYSTEM_BASE + " Делаешь глубокий рерайт: меняешь структуру фраз и лексику, сохраняя все факты, все абзацы и объём исходника. Никогда не сокращаешь текст.",
    promptTemplate: "Сделай рерайт текста. Стиль: {{style}}.\n\nТекст:\n{{source}}",
  },
  {
    slug: "correct",
    title: "Правка текста",
    description: "Исправит орфографию, пунктуацию и стилистику",
    publicPath: "/text-corrector",
    seoTitle: "Проверка и исправление текста онлайн нейросетью — SEOPTIMUS",
    seoDescription: "Нейросеть исправит орфографию, пунктуацию и стилистические ошибки. Бесплатно без регистрации.",
    sort: 5,
    fields: [
      f("source", "Текст", "textarea", { required: true }),
      f("mode", "Что исправить", "select", { options: ["Орфография и пунктуация", "Плюс стилистика и смысл"] }),
    ],
    systemPrompt: SYSTEM_BASE + " Ты корректор. Возвращаешь только исправленный текст.",
    promptTemplate: "Исправь текст. Режим: {{mode}}.\n\nТекст:\n{{source}}",
  },
  {
    slug: "smm",
    title: "Посты для соцсетей",
    description: "Пост для ВКонтакте, Telegram, VC.ru и других площадок",
    publicPath: "/smm-generator",
    seoTitle: "Генератор постов для соцсетей нейросетью — SEOPTIMUS",
    seoDescription: "Нейросеть напишет пост для ВКонтакте, Telegram или VC.ru. Бесплатно без регистрации.",
    sort: 6,
    fields: [
      f("network", "Площадка", "select", { options: ["ВКонтакте", "Telegram", "VC.ru", "Дзен", "Одноклассники"], required: true }),
      f("topic", "О чём пост", "textarea", { required: true }),
      f("emoji", "Эмодзи", "select", { options: ["Да", "Нет"] }),
    ],
    systemPrompt: SYSTEM_BASE + " Ты SMM-специалист, знаешь форматы и длину постов для каждой площадки.",
    promptTemplate: "Напиши пост для площадки {{network}}.\nТема: {{topic}}\nИспользовать эмодзи: {{emoji}}",
  },
  {
    slug: "product-card",
    title: "Карточка товара",
    description: "Описание товара для Ozon, Wildberries, Авито",
    publicPath: null,
    sort: 7,
    fields: [
      f("marketplace", "Площадка", "select", { options: ["Ozon", "Wildberries", "Авито", "Яндекс Маркет"], required: true }),
      f("product", "Товар и характеристики", "textarea", { required: true }),
    ],
    systemPrompt: SYSTEM_BASE + " Ты знаешь требования маркетплейсов к описаниям и запреты на рекламные слова.",
    promptTemplate: "Напиши описание товара для {{marketplace}}.\nТовар: {{product}}",
  },
];

async function main() {
  for (const p of plans) await db.insert(schema.plans).values(p).onConflictDoNothing();
  for (const m of models) await db.insert(schema.models).values(m).onConflictDoNothing();
  for (const g of generators) await db.insert(schema.generators).values(g).onConflictDoNothing();
  console.log("Seed done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
