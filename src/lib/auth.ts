import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomInt } from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendMail } from "./mail";
import { addCredits } from "./billing";

const COOKIE = "sid";
const SIGNUP_BONUS = 50;
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map(normalizeEmail).filter(Boolean);

export async function requestLoginCode(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Некорректный email");
  const code = String(randomInt(100000, 1000000));
  await db.insert(schema.loginCodes).values({
    email,
    codeHash: hash(code),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  await sendMail(email, `Код входа в SEOPTIMUS: ${code}`, `Ваш код для входа: ${code}\nКод действует 15 минут.`);
}

export async function verifyLoginCode(emailRaw: string, code: string) {
  const email = normalizeEmail(emailRaw);
  const [row] = await db
    .select()
    .from(schema.loginCodes)
    .where(
      and(
        eq(schema.loginCodes.email, email),
        isNull(schema.loginCodes.usedAt),
        gt(schema.loginCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.loginCodes.id))
    .limit(1);
  if (!row || row.attempts >= 5) throw new Error("Код истёк, запросите новый");
  if (row.codeHash !== hash(code.trim())) {
    await db
      .update(schema.loginCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(schema.loginCodes.id, row.id));
    throw new Error("Неверный код");
  }
  await db.update(schema.loginCodes).set({ usedAt: new Date() }).where(eq(schema.loginCodes.id, row.id));

  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const isAdmin = adminEmails().includes(email);
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email, role: isAdmin ? "admin" : "user" })
      .returning();
    await addCredits(user.id, SIGNUP_BONUS, "signup_bonus");
  } else if (isAdmin && user.role !== "admin") {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id));
  }
  if (user.blocked) throw new Error("Аккаунт заблокирован");

  const token = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return user;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, Number(payload.uid)));
    if (!user || user.blocked) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");
  return user;
}

/** Есть ли активная подписка */
export const hasActivePlan = (u: { planSlug: string | null; planUntil: Date | null }) =>
  !!u.planSlug && !!u.planUntil && u.planUntil > new Date();
