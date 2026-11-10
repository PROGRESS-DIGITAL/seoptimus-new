# SEOPTIMUS

Сервис генерации текстов и изображений нейросетью: публичный сайт с SEO-страницами, личный кабинет и админка в одном приложении.

Стек: Next.js 15 (App Router), TypeScript, Tailwind, PostgreSQL + Drizzle ORM, OpenAI API, CloudPayments.

## Запуск

```bash
cp .env.example .env.local   # заполнить значения
npm install
npx drizzle-kit push         # создать таблицы (нужен DATABASE_URL в окружении)
npm run db:seed              # тарифы, модели, генераторы
npm run dev                  # или npm run build && npm start
```

Без `OPENAI_API_KEY` приложение работает в демо-режиме: вместо нейросети отвечает заглушка, всё остальное (лимиты, кредиты, история) работает по-настоящему. Без `SMTP_URL` код входа печатается в лог сервера.

Администраторы задаются в `ADMIN_EMAILS`: при входе с таким email пользователь получает роль admin.

## Что где

| Раздел | Адрес | Код |
| --- | --- | --- |
| Главная с бесплатной генерацией | `/` | `src/app/(public)/(home)` |
| SEO-страницы генераторов (старые URL) | `/seo-generator`, `/articles-generator`, `/text-rewriter`, `/text-corrector`, `/smm-generator` | `src/app/(public)/[slug]` |
| Тарифы | `/tarification` | `src/app/(public)/tarification` |
| Кабинет: чат, генераторы, картинки, история, оплата | `/app/...` | `src/app/app` |
| Админка: сводка, пользователи, модели, генераторы, тарифы | `/admin/...` | `src/app/admin` |
| AI-шлюз (провайдеры) | | `src/lib/ai/gateway.ts` |
| Кредиты и списания | | `src/lib/billing.ts` |
| Гостевой лимит | | `src/lib/guest.ts` |
| Вебхуки CloudPayments | `/api/cloudpayments/{check,pay,fail,recurrent}` | `src/app/api/cloudpayments` |

## Как устроена оплата

- Валюта сервиса — кредиты. Текстовая модель списывает `creditPrice` за 1000 токенов (не меньше `minCredits`), картинка — `creditPrice` за штуку. Цены задаются в админке.
- Тариф начисляет `monthlyCredits` при каждой оплате и открывает платные модели до `plan_until`.
- Виджет CloudPayments передаёт `accountId = email` и `data.plan`. Старые подписки с Tilda определяются по описанию платежа («Оптимус», «Оптимус PRO», «Максимус», «Бизнес») — см. `detectPlan` в `src/lib/cloudpayments.ts`.
- Уведомления проверяются по подписи HMAC (`CLOUDPAYMENTS_API_SECRET`).

## Что ещё не сделано

- Claude, Perplexity и другие провайдеры (добавляются в `gateway.ts` и записью модели в админке)
- 15 страниц `/neiroset-dlya-...`, блог `/statyi`, юридические страницы
- Хранение картинок в S3 (сейчас на диске сервера)
- Капча и защита гостевого лимита от ботов, ограничение частоты запроса кода входа
- Импорт пользователей из Tilda Members
- Проверка уникальности (text.ru), команды, API

## Бренд и SEO

Яндекс накладывал на старый сайт ограничение «Мимикрия» (сходство с чужим брендом). Поэтому в публичных текстах, title, description и названиях моделей не используем чужие бренды и логотипы (ChatGPT, OpenAI, GPT и т. п.). Модели для пользователя называются нейтрально: «Быстрая», «Умная», «Изображения».
