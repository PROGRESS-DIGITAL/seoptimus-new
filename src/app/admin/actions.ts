"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { GeneratorField } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { addCredits } from "@/lib/billing";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0;
const bool = (f: FormData, k: string) => f.get(k) === "on";

export async function saveModel(f: FormData) {
  await requireAdmin();
  const slug = str(f, "slug");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("slug: только латиница, цифры и дефис");
  const values = {
    title: str(f, "title"),
    provider: str(f, "provider") || "openai",
    providerModel: str(f, "providerModel"),
    kind: (str(f, "kind") === "image" ? "image" : "text") as "text" | "image",
    creditPrice: num(f, "creditPrice"),
    minCredits: num(f, "minCredits"),
    freeAccess: bool(f, "freeAccess"),
    enabled: bool(f, "enabled"),
    isDefault: bool(f, "isDefault"),
    sort: num(f, "sort"),
  };
  if (values.isDefault)
    await db.update(schema.models).set({ isDefault: false }).where(eq(schema.models.kind, values.kind));
  await db.insert(schema.models).values({ slug, ...values }).onConflictDoUpdate({ target: schema.models.slug, set: values });
  revalidatePath("/admin/models");
}

export async function saveGenerator(f: FormData) {
  await requireAdmin();
  const slug = str(f, "slug");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("slug: только латиница, цифры и дефис");
  let fields: GeneratorField[];
  try {
    fields = JSON.parse(str(f, "fields"));
    if (!Array.isArray(fields)) throw 0;
  } catch {
    throw new Error("Поля формы: некорректный JSON");
  }
  const publicPath = str(f, "publicPath");
  const values = {
    title: str(f, "title"),
    description: str(f, "description"),
    publicPath: publicPath ? "/" + publicPath.replace(/^\/+/, "") : null,
    seoTitle: str(f, "seoTitle") || null,
    seoDescription: str(f, "seoDescription") || null,
    fields,
    systemPrompt: str(f, "systemPrompt"),
    promptTemplate: str(f, "promptTemplate"),
    defaultModel: str(f, "defaultModel") || null,
    guestAllowed: bool(f, "guestAllowed"),
    enabled: bool(f, "enabled"),
    sort: num(f, "sort"),
  };
  await db.insert(schema.generators).values({ slug, ...values }).onConflictDoUpdate({ target: schema.generators.slug, set: values });
  revalidatePath("/admin/generators");
  redirect("/admin/generators");
}

export async function savePlan(f: FormData) {
  await requireAdmin();
  const slug = str(f, "slug");
  const values = {
    name: str(f, "name"),
    priceRub: num(f, "priceRub"),
    monthlyCredits: num(f, "monthlyCredits"),
    description: str(f, "description"),
    active: bool(f, "active"),
    sort: num(f, "sort"),
  };
  await db.insert(schema.plans).values({ slug, ...values }).onConflictDoUpdate({ target: schema.plans.slug, set: values });
  revalidatePath("/admin/plans");
}

export async function adjustUser(f: FormData) {
  const admin = await requireAdmin();
  const id = num(f, "id");
  const delta = num(f, "delta");
  if (delta) await addCredits(id, delta, "admin", `by:${admin.email}`);
  const planSlug = str(f, "planSlug") || null;
  const until = str(f, "planUntil");
  await db
    .update(schema.users)
    .set({
      planSlug,
      planUntil: until ? new Date(until + "T23:59:59") : null,
      blocked: bool(f, "blocked"),
      role: str(f, "role") === "admin" ? "admin" : "user",
    })
    .where(eq(schema.users.id, id));
  revalidatePath("/admin/users");
}
