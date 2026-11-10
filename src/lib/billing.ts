import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Model } from "@/db/schema";

export class InsufficientCredits extends Error {
  constructor() {
    super("Недостаточно кредитов. Пополните баланс или смените модель.");
  }
}

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

export function textCost(model: Model, tokens: number) {
  return Math.max(model.minCredits, Math.ceil((tokens / 1000) * model.creditPrice));
}

export function imageCost(model: Model, count = 1) {
  return Math.max(model.minCredits, model.creditPrice * count);
}
