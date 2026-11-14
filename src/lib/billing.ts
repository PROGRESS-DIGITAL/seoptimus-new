import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Model } from "@/db/schema";
import { creditsFor, imageCostRub, textCostRub, worstCreditRub } from "./economics";
import { activePlans } from "./pricing";

export class InsufficientCredits extends Error {
  constructor() {
    super("Недостаточно кредитов. Пополните баланс или смените модель.");
  }
}

/** Админы (ADMIN_EMAILS) генерируют без ограничений: кредиты не проверяются и не списываются */
export const isUnlimited = (user: { role: string } | null | undefined) => user?.role === "admin";

export async function addCredits(userId: number, delta: number, reason: string, ref?: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ credits: sql`${schema.users.credits} + ${delta}` })
      .where(eq(schema.users.id, userId));
    await tx.insert(schema.ledger).values({ userId, delta, reason, ref });
  });
}

/** Атомарное списание: не уводит баланс в минус */
export async function chargeCredits(userId: number, amount: number, reason: string, ref?: string) {
  if (amount <= 0) return;
  await db.transaction(async (tx) => {
    const res = await tx
      .update(schema.users)
      .set({ credits: sql`${schema.users.credits} - ${amount}` })
      .where(and(eq(schema.users.id, userId), gte(schema.users.credits, amount)))
      .returning({ id: schema.users.id });
    if (res.length === 0) throw new InsufficientCredits();
    await tx.insert(schema.ledger).values({ userId, delta: -amount, reason, ref });
  });
}

/** Списание после генерации: если кредитов не хватает на фактическую стоимость, списываем остаток */
export async function chargeUpTo(userId: number, amount: number, reason: string, ref?: string) {
  if (amount <= 0) return 0;
  return db.transaction(async (tx) => {
    const [u] = await tx
      .select({ credits: schema.users.credits })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .for("update");
    const take = Math.max(0, Math.min(amount, u?.credits ?? 0));
    if (take === 0) return 0;
    await tx
      .update(schema.users)
      .set({ credits: sql`${schema.users.credits} - ${take}` })
      .where(eq(schema.users.id, userId));
    await tx.insert(schema.ledger).values({ userId, delta: -take, reason, ref });
    return take;
  });
}

/** Цена кредита в худшем случае (самый выгодный тариф или пакет), рублей */
export async function creditRub() {
  return worstCreditRub(await activePlans());
}

/** Кредиты за текст по фактическим токенам, наценка не ниже 10 к 1 */
export async function textCost(model: Model, tokensIn: number, tokensOut: number) {
  return creditsFor(textCostRub(model, tokensIn, tokensOut), await creditRub(), model.minCredits);
}

/** Кредиты за изображение (референсы тоже стоят денег) */
export async function imageCost(model: Model, refs = 0) {
  return creditsFor(imageCostRub(model, refs), await creditRub(), model.minCredits);
}
