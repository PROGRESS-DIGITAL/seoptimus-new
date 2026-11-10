import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const activePlans = () =>
  db.select().from(schema.plans).where(eq(schema.plans.active, true)).orderBy(asc(schema.plans.sort));
