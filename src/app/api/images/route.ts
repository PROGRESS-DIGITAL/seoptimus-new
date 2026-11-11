import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { providerFor, type ImageRef } from "@/lib/ai/gateway";
import { addCredits, chargeCredits, imageCost } from "@/lib/billing";
import { errMessage, jsonError } from "@/lib/http";
import { MAX_REF_BYTES, MAX_REFS, formatByRatio } from "@/lib/image-formats";
import { resolveModel } from "@/lib/models";
import { saveFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 180;

const REF_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Принимает multipart: prompt, ratio, model и до 4 файлов refs */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return jsonError("Войдите в аккаунт", 401);
  let paid = 0;
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
    const charged = imageCost(model);
    await chargeCredits(user.id, charged, "image", model.slug); // списываем заранее, при ошибке вернём
    paid = charged;
    const img = await providerFor(model).generateImage(model, prompt, format, refs);
    const url = await saveFile(img.data, img.ext);
    await db.insert(schema.generations).values({
      userId: user.id,
      kind: "image",
      modelSlug: model.slug,
      input: { prompt, ratio: format.ratio, ...(refs.length ? { refs: String(refs.length) } : {}) },
      output: url,
      credits: charged,
    });
    return NextResponse.json({ url, ratio: format.ratio, credits: charged });
  } catch (e) {
    if (paid) await addCredits(user.id, paid, "refund_image");
    return jsonError(errMessage(e), 400);
  }
}
