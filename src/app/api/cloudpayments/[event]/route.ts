import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { addCredits } from "@/lib/billing";
import { detectPlan, parseBody, verifyHmac } from "@/lib/cloudpayments";
import { normalizeEmail } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Уведомления CloudPayments. В личном кабинете кассы указать:
 *   Check:     {APP_URL}/api/cloudpayments/check
 *   Pay:       {APP_URL}/api/cloudpayments/pay
 *   Fail:      {APP_URL}/api/cloudpayments/fail
 *   Recurrent: {APP_URL}/api/cloudpayments/recurrent
 * Ответ {code: 0} = принято.
 */
const ok = () => NextResponse.json({ code: 0 });

async function findOrCreateUser(accountId: string, email?: string) {
  const e = normalizeEmail(accountId.includes("@") ? accountId : email || accountId);
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, e));
  if (!user) [user] = await db.insert(schema.users).values({ email: e }).returning();
  return user;
}

export async function POST(req: Request, { params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  const raw = await req.text();
  const sig = req.headers.get("content-hmac") ?? req.headers.get("x-content-hmac");
  if (!verifyHmac(raw, sig)) return NextResponse.json({ code: 13 }, { status: 401 });
  const data = parseBody(raw, req.headers.get("content-type"));

  switch (event) {
    case "check": {
      // 0 — платёж можно проводить, 13 — отклонить (неизвестный тариф)
      const plan = detectPlan(data);
      if (plan) {
        const [p] = await db.select().from(schema.plans).where(eq(schema.plans.slug, plan));
        if (!p) return NextResponse.json({ code: 13 });
      }
      return ok();
    }
    case "pay": {
      const txId = data.TransactionId;
      const [exists] = await db.select().from(schema.payments).where(eq(schema.payments.transactionId, txId));
      if (exists) return ok(); // повторное уведомление
      const user = await findOrCreateUser(data.AccountId || data.Email, data.Email);
      const planSlug = detectPlan(data);
      const [plan] = planSlug
        ? await db.select().from(schema.plans).where(eq(schema.plans.slug, planSlug))
        : [];
      await db.insert(schema.payments).values({
        transactionId: txId,
        userId: user.id,
        email: user.email,
        planSlug: plan?.slug ?? null,
        amount: Math.round(Number(data.Amount)),
        kind: data.SubscriptionId ? "subscription" : "one_time",
        status: data.Status || "Completed",
        subscriptionId: data.SubscriptionId || null,
        raw: data,
      });
      if (plan) {
        const base = user.planUntil && user.planUntil > new Date() ? user.planUntil : new Date();
        const until = new Date(base);
        until.setMonth(until.getMonth() + 1);
        await db
          .update(schema.users)
          .set({ planSlug: plan.slug, planUntil: until })
          .where(eq(schema.users.id, user.id));
        await addCredits(user.id, plan.monthlyCredits, "plan_payment", txId);
      } else {
        // Разовая покупка пакета: Data.credits
        let credits = 0;
        try {
          credits = Number(JSON.parse(data.Data || "{}").credits) || 0;
        } catch {}
        if (credits > 0) await addCredits(user.id, credits, "credits_pack", txId);
      }
      return ok();
    }
    case "recurrent": {
      // Смена статуса подписки. При отмене тариф доживает до оплаченной даты.
      console.log("[cloudpayments] recurrent", data.Id, data.AccountId, data.Status);
      return ok();
    }
    case "fail":
      console.log("[cloudpayments] fail", data.TransactionId, data.AccountId, data.Reason);
      return ok();
    default:
      return ok();
  }
}
