import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

const limit = () => Number(process.env.GUEST_DAILY_LIMIT ?? 3);
const today = () => new Date().toISOString().slice(0, 10);

/** Ключи гостя: cookie и хэш IP. Лимит считается по обоим, чтобы очистка cookie не помогала */
async function guestKeys(canSetCookie: boolean) {
  const jar = await cookies();
  let gid = jar.get("gid")?.value;
  if (!gid && canSetCookie) {
    gid = randomUUID();
    jar.set("gid", gid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const ipKey = "ip:" + createHash("sha256").update(ip + process.env.SESSION_SECRET).digest("hex").slice(0, 32);
  return { cookieKey: gid ? "c:" + gid : ipKey, ipKey };
}

/** Остаток гостевых генераций. В рендере страницы cookie не ставим (Next.js это запрещает). */
export async function guestRemaining(canSetCookie = false) {
  const { cookieKey, ipKey } = await guestKeys(canSetCookie);
  const rows = await db.execute<{ count: number }>(
    sql`select coalesce(max(count),0)::int as count from ${schema.guestUsage} where day = ${today()} and key in (${cookieKey}, ${ipKey})`,
  );
  return Math.max(0, limit() - Number(rows[0]?.count ?? 0));
}

/** Резервирует одну гостевую генерацию. Возвращает ключ гостя или бросает ошибку. */
export async function consumeGuest() {
  if ((await guestRemaining(true)) <= 0)
    throw new Error("Бесплатные генерации на сегодня закончились. Зарегистрируйтесь и получите 50 кредитов в подарок.");
  const { cookieKey, ipKey } = await guestKeys(true);
  for (const key of new Set([cookieKey, ipKey])) {
    await db
      .insert(schema.guestUsage)
      .values({ key, day: today(), count: 1 })
      .onConflictDoUpdate({
        target: [schema.guestUsage.key, schema.guestUsage.day],
        set: { count: sql`${schema.guestUsage.count} + 1` },
      });
  }
  return cookieKey;
}
