import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { providerFor, type ImageRef } from "@/lib/ai/gateway";
import { chargeCredits, imageCost } from "@/lib/billing";
import { errMessage, jsonError } from "@/lib/http";
import { MAX_REF_BYTES, MAX_REFS, formatByRatio, type ImageFormat } from "@/lib/image-formats";
import { resolveModel } from "@/lib/models";
import type { Model } from "@/db/schema";
import { saveFile } from "@/lib/storage";
import { failJob } from "@/lib/image-jobs";

export const runtime = "nodejs";

const REF_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Принимает multipart: prompt, ratio, model и до 4 файлов refs.
 * Отвечает сразу id задачи, сама генерация идёт в фоне (см. /api/images/[id]).
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return jsonError("Войдите в аккаунт", 401);
  try {
    const form = await req.formData();
    const prompt = String(form.get("prompt") ?? "").trim().slice(0, 4000);
    const files = form.getAll("refs").filter((f): f is File => f instanceof File && f.size > 0);
    if (!prompt) return jsonError(files.length ? "Напишите, что сделать с изображением" : "Опишите изображение");
    if (files.length > MAX_REFS) return jsonError(`Можно загрузить до ${MAX_REFS} референсов`);
    const refs: ImageRef[] = [];
    for (const f of files) {
      if (!REF_TYPES.includes(f.type)) return jsonError("Референс должен быть в формате JPG, PNG или WEBP");
      if (f.size > MAX_REF_BYTES) return jsonError("Референс больше 10 МБ");
      refs.push({ data: Buffer.from(await f.arrayBuffer()), name: f.name || "ref.png", type: f.type });
    }
    const format = formatByRatio(form.get("ratio"));
    const model = await resolveModel("image", String(form.get("model") ?? "") || null, user);
    const charged = await imageCost(model, refs.length);
    await chargeCredits(user.id, charged, "image", model.slug); // списываем заранее, при ошибке вернём
    const id = randomUUID();
    await db.insert(schema.imageJobs).values({ id, userId: user.id, ratio: format.ratio, credits: charged });
    void run(id, user.id, model, prompt, format, refs, charged);
    return NextResponse.json({ id, ratio: format.ratio, credits: charged });
  } catch (e) {
    return jsonError(errMessage(e), 400);
  }
}

async function run(id: string, userId: number, model: Model, prompt: string, format: ImageFormat, refs: ImageRef[], charged: number) {
  try {
    const img = await providerFor(model).generateImage(model, prompt, format, refs);
    const url = await saveFile(img.data, img.ext);
    await db.insert(schema.generations).values({
      userId,
      kind: "image",
      modelSlug: model.slug,
      input: { prompt, ratio: format.ratio, ...(refs.length ? { refs: String(refs.length) } : {}) },
      output: url,
      credits: charged,
    });
    await db.update(schema.imageJobs).set({ status: "done", url }).where(eq(schema.imageJobs.id, id));
  } catch (e) {
    console.error("[images]", e);
    await failJob(id, userId, charged, errMessage(e));
  }
}
