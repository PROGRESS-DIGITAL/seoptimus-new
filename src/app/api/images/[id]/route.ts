import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { JOB_STALE_MS, failJob } from "@/lib/image-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Статус фоновой генерации картинки */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return jsonError("Войдите в аккаунт", 401);
  const { id } = await params;
  const [job] = await db
    .select()
    .from(schema.imageJobs)
    .where(and(eq(schema.imageJobs.id, id), eq(schema.imageJobs.userId, user.id)));
  if (!job) return jsonError("Задача не найдена", 404);
  if (job.status === "pending" && Date.now() - job.createdAt.getTime() > JOB_STALE_MS) {
    const message = "Генерация прервалась на сервере. Кредиты вернули, попробуйте ещё раз.";
    await failJob(job.id, user.id, job.credits, message);
    return NextResponse.json({ status: "error", error: message });
  }
  return NextResponse.json(
    { status: job.status, url: job.url, ratio: job.ratio, error: job.error },
    { headers: { "Cache-Control": "no-store" } },
  );
}
