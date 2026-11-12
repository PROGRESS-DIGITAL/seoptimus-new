import "server-only";
import type { Model } from "@/db/schema";
import { imageCost, textCost } from "./billing";
import { TYPICAL_TEXT } from "./economics";
import { listModels } from "./models";

/** Что входит в любой платный тариф. Только то, что реально работает. */
export const PLAN_FEATURES = [
  "Все генераторы и чат с памятью",
  "Умная модель для сложных текстов",
  "Изображения 1:1, 9:16, 16:9, 3:4, 4:3 + загрузка вашего фото",
  "История, копирование, подсказки",
  "Кредиты переходят на следующий месяц",
  "Отмена подписки в один клик",
];

export const PLAN_EXTRA: Record<string, string[]> = {
  business: ["Оплата по счёту для юрлиц"],
};

/** Округление до «красивого» числа вниз: 666 → 650, 2666 → 2 600 */
function nice(n: number) {
  if (n < 20) return Math.floor(n);
  const step = n < 200 ? 10 : n < 1000 ? 50 : n < 5000 ? 100 : 500;
  return Math.floor(n / step) * step;
}

export type PlanEstimate = { fast: number; smart: number; images: number };

/** Цены считаются от стоимости моделей с наценкой (lib/economics): оценки меняются вместе с ними */
export async function planPricing() {
  const [text, image] = await Promise.all([listModels("text"), listModels("image")]);
  const fast = text.find((m) => m.isDefault) ?? text[0];
  const smart = [...text].sort((a, b) => b.costOut - a.costOut)[0];
  const img = image[0];
  const perText = async (m?: Model) => (m ? textCost(m, TYPICAL_TEXT.tokensIn, TYPICAL_TEXT.tokensOut) : 0);
  const costs = { fast: await perText(fast), smart: await perText(smart), image: img ? await imageCost(img) : 0 };
  const estimate = (credits: number): PlanEstimate => ({
    fast: costs.fast ? nice(credits / costs.fast) : 0,
    smart: costs.smart && smart !== fast ? nice(credits / costs.smart) : 0,
    images: costs.image ? nice(credits / costs.image) : 0,
  });
  return { costs, estimate };
}
