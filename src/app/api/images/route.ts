import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { isDemoMode, providerFor } from "@/lib/ai/gateway";
import { addCredits, chargeCredits, imageCost } from "@/lib/billing";
import { errMessage, jsonError } from "@/lib/http";
import { resolveModel } from "@/lib/models";
import { saveFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

const SIZES = ["1024x1024", "1536x1024", "1024x1536"];

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return jsonError("Войдите в аккаунт", 401);
  let paid = 0;
  try {
    const body = await req.json();
    const prompt = String(body.prompt ?? "").trim().slice(0, 4000);
    if (!prompt) return jsonError("Опишите изображение");
    const size = SIZES.includes(body.size) ? body.size : SIZES[0];
    const model = await resolveModel("image", body.model, user);
    const charged = imageCost(model);
    await chargeCredits(user.id, charged, "image", model.slug); // списываем заранее, при ошибке вернём
    paid = charged;
    const buf = await providerFor(model).generateImage(model, prompt, size);
    const url = await saveFile(buf, isDemoMode() ? "svg" : "png");
    await db.insert(schema.generations).values({
      userId: user.id,
      kind: "image",
      modelSlug: model.slug,
      input: { prompt, size },
      output: url,
      credits: charged,
    });
    return NextResponse.json({ url, credits: charged });
  } catch (e) {
    if (paid) await addCredits(user.id, paid, "refund_image");
    return jsonError(errMessage(e), 400);
  }
}
