import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import ImageStudio from "@/components/ImageStudio";
import PageHead from "@/components/PageHead";
import { requireUser } from "@/lib/auth";
import { modelOptions } from "@/lib/generators";

export default async function Images() {
  const user = await requireUser();
  const recent = await db
    .select({ output: schema.generations.output, input: schema.generations.input })
    .from(schema.generations)
    .where(and(eq(schema.generations.userId, user.id), eq(schema.generations.kind, "image")))
    .orderBy(desc(schema.generations.id))
    .limit(24);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:p-10">
      <PageHead title="Изображения" hint="Опишите картинку словами, остальное сделает нейросеть" />
      <ImageStudio models={await modelOptions("image", user)} recent={recent.map((r) => ({ url: r.output, ratio: r.input.ratio ?? sizeToRatio(r.input.size) }))} />
    </div>
  );
}

/** Старые записи хранили размер в пикселях */
function sizeToRatio(size?: string) {
  const [w, h] = (size ?? "1024x1024").split("x").map(Number);
  return w > h ? "3:2" : w < h ? "2:3" : "1:1";
}
