import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@/db";
import { IMAGE_FORMATS } from "@/lib/image-formats";
import { saveFile } from "@/lib/storage";

/** Ближайший формат генератора по пропорциям картинки */
export function nearestRatio(w: number, h: number) {
  const r = w / h;
  return IMAGE_FORMATS.reduce((best, f) => {
    const d = Math.abs(Math.log(f.width / f.height / r));
    return d < best.d ? { ratio: f.ratio, d } : best;
  }, { ratio: IMAGE_FORMATS[0].ratio as string, d: Infinity }).ratio;
}

/** Сжимаем в webp до 1200 px по большей стороне, чтобы главная грузилась быстро */
export async function addGalleryImage(buf: Buffer, caption: string) {
  const img = sharp(buf, { failOn: "error" }).rotate();
  const out = await img.resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const { width, height } = out.info;
  const url = await saveFile(out.data, "webp");
  await db.insert(schema.galleryImages).values({ url, width, height, ratio: nearestRatio(width, height), caption });
}

export const galleryAll = () =>
  db.select().from(schema.galleryImages).orderBy(asc(schema.galleryImages.sort), desc(schema.galleryImages.id));

export const galleryPublic = () =>
  db
    .select()
    .from(schema.galleryImages)
    .where(and(eq(schema.galleryImages.enabled, true)))
    .orderBy(asc(schema.galleryImages.sort), desc(schema.galleryImages.id))
    .limit(60);
