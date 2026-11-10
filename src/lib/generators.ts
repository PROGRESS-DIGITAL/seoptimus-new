import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { canUseModel, listModels } from "./models";

export const enabledGenerators = () =>
  db.select().from(schema.generators).where(eq(schema.generators.enabled, true)).orderBy(asc(schema.generators.sort));

export async function generatorBySlug(slug: string) {
  const [g] = await db
    .select()
    .from(schema.generators)
    .where(and(eq(schema.generators.slug, slug), eq(schema.generators.enabled, true)));
  return g ?? null;
}

export async function generatorByPath(path: string) {
  const [g] = await db
    .select()
    .from(schema.generators)
    .where(and(eq(schema.generators.publicPath, path), eq(schema.generators.enabled, true)));
  return g ?? null;
}

export async function modelOptions(kind: "text" | "image", user: User | null) {
  const models = await listModels(kind);
  return models.map((m) => ({ slug: m.slug, title: m.title, locked: !canUseModel(m, user), price: m.creditPrice }));
}
