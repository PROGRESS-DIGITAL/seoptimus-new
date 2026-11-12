import { cookies } from "next/headers";

export type Theme = "dark" | "light";

/** Тема кабинета и админки из cookie (общая для обоих разделов) */
export async function getTheme(): Promise<Theme> {
  const c = await cookies();
  const v = c.get("theme")?.value ?? c.get("admin_theme")?.value;
  return v === "light" ? "light" : "dark";
}
