import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { addCredits } from "@/lib/billing";

/** Дольше этого задача не идёт: значит, сервер перезапускался посреди генерации */
export const JOB_STALE_MS = 6 * 60 * 1000;

/** Помечает задачу ошибкой и возвращает кредиты ровно один раз */
export async function failJob(id: string, userId: number, credits: number, message: string) {
  const rows = await db
    .update(schema.imageJobs)
    .set({ status: "error", error: message })
    .where(and(eq(schema.imageJobs.id, id), eq(schema.imageJobs.status, "pending")))
    .returning({ id: schema.imageJobs.id });
  if (rows.length && credits) await addCredits(userId, credits, "refund_image");
}
