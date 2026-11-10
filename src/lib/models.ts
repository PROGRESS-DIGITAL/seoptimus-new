import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Model, User } from "@/db/schema";
import { hasActivePlan } from "./auth";

export async function listModels(kind: "text" | "image") {
  return db
    .select()
    .from(schema.models)
    .where(and(eq(schema.models.kind, kind), eq(schema.models.enabled, true)))
    .orderBy(asc(schema.models.sort));
}

export const canUseModel = (model: Model, user: User | null) =>
  model.freeAccess || (!!user && (user.role === "admin" || hasActivePlan(user)));

/** Модель по slug с проверкой доступа; без slug берётся модель по умолчанию */
export async function resolveModel(kind: "text" | "image", slug: string | null | undefined, user: User | null) {
  const all = await listModels(kind);
  const model = slug
    ? all.find((m) => m.slug === slug)
    : all.find((m) => m.isDefault && canUseModel(m, user)) ?? all.find((m) => canUseModel(m, user));
  if (!model) throw new Error("Модель недоступна");
  if (!canUseModel(model, user)) throw new Error(`Модель «${model.title}» доступна на платных тарифах`);
  return model;
}
