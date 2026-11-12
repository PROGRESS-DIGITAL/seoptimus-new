import "server-only";
import type { Model } from "@/db/schema";

/**
 * Экономика: цена в кредитах считается от реальной стоимости модели у провайдера,
 * чтобы выручка была не меньше чем в MIN_MARKUP раз выше затрат (по умолчанию 10 к 1).
 *
 * Курс и наценка задаются в .env, стоимость моделей (USD) в админке.
 */
export const USD_RUB = Number(process.env.USD_RUB) || 100;
export const MIN_MARKUP = Number(process.env.MIN_MARKUP) || 10;

/** Разовые пакеты кредитов без подписки */
export const PACKS = [
  { credits: 500, price: 290 },
  { credits: 2000, price: 990 },
];

/**
 * Сколько рублей мы получаем за 1 кредит в худшем случае: самый выгодный для клиента
 * тариф или пакет. От этой цены считаем наценку, тогда 10 к 1 выполняется везде.
 */
export function worstCreditRub(plans: { priceRub: number; monthlyCredits: number }[]) {
  const rates = [
    ...plans.filter((p) => p.monthlyCredits > 0).map((p) => p.priceRub / p.monthlyCredits),
    ...PACKS.map((p) => p.price / p.credits),
  ];
  return Math.min(...rates);
}

/** Затраты в рублях */
export function textCostRub(model: Model, tokensIn: number, tokensOut: number) {
  return ((tokensIn * model.costIn + tokensOut * model.costOut) / 1_000_000) * USD_RUB;
}
export const imageCostRub = (model: Model, refs = 0) => (model.costOut + refs * model.costIn) * USD_RUB;

/** Кредиты за запрос с наценкой не ниже MIN_MARKUP */
export function creditsFor(costRub: number, creditRub: number, minCredits: number) {
  return Math.max(minCredits, Math.ceil((costRub * MIN_MARKUP) / creditRub));
}

/** Типичный текст для оценок в тарифах: запрос + ответ около 3 000 знаков (с учётом «размышлений» модели) */
export const TYPICAL_TEXT = { tokensIn: 600, tokensOut: 1800 };
