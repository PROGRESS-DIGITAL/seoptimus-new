import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/** Проверка подписи уведомления CloudPayments (заголовок Content-HMAC или X-Content-HMAC) */
export function verifyHmac(rawBody: string, header: string | null) {
  const secret = process.env.CLOUDPAYMENTS_API_SECRET;
  if (!secret || !header) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Тело уведомления приходит как form-urlencoded или JSON, в зависимости от настроек кассы */
export function parseBody(raw: string, contentType: string | null): Record<string, string> {
  if (contentType?.includes("json")) {
    const obj = JSON.parse(raw);
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]),
    );
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/**
 * Определение тарифа. Новые платежи передают plan в Data.
 * Старые подписки с Tilda определяются по описанию (Оптимус, Оптимус PRO, Максимус, Бизнес).
 */
export function detectPlan(data: Record<string, string>): string | null {
  try {
    const d = JSON.parse(data.Data || "{}");
    if (typeof d.plan === "string") return d.plan;
  } catch {}
  const desc = (data.Description || "").toLowerCase();
  if (desc.includes("бизнес")) return "business";
  if (desc.includes("оптимус pro") || desc.includes("максимус") || desc.includes("безлимит")) return "pro";
  if (desc.includes("оптимус") || desc.includes("минимус")) return "start";
  return null;
}

const auth = () =>
  "Basic " +
  Buffer.from(`${process.env.CLOUDPAYMENTS_PUBLIC_ID}:${process.env.CLOUDPAYMENTS_API_SECRET}`).toString("base64");

/** Активные подписки по AccountId (в старой версии AccountId = email) */
export async function findSubscriptions(accountId: string) {
  const res = await fetch(
    `https://api.cloudpayments.ru/subscriptions/find?accountId=${encodeURIComponent(accountId)}`,
    { method: "POST", headers: { Authorization: auth(), "Content-Type": "application/json" } },
  );
  const json = await res.json();
  return (json.Model ?? []) as { Id: string; Status: string; Description: string; Amount: number; NextTransactionDateIso: string }[];
}

export async function cancelSubscription(id: string) {
  await fetch("https://api.cloudpayments.ru/subscriptions/cancel", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ Id: id }),
  });
}
