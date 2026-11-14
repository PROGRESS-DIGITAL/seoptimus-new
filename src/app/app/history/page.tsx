import { toPlainText } from "@/lib/plain-text";
import RichText from "@/components/RichText";
import { desc, eq } from "drizzle-orm";
import { ChevronDown, ImageIcon } from "lucide-react";
import { db, schema } from "@/db";
import { generatorIcon } from "@/components/GeneratorCard";
import CopyButton from "@/components/CopyButton";
import PageHead from "@/components/PageHead";
import { requireUser } from "@/lib/auth";

export default async function History() {
  const user = await requireUser();
  const [rows, gens] = await Promise.all([
    db
      .select()
      .from(schema.generations)
      .where(eq(schema.generations.userId, user.id))
      .orderBy(desc(schema.generations.id))
      .limit(100),
    db.select({ slug: schema.generators.slug, title: schema.generators.title }).from(schema.generators),
  ]);
  const titles = Object.fromEntries(gens.map((g) => [g.slug, g.title]));
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:p-10">
      <PageHead title="История" hint="Последние 100 генераций" />
      {rows.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line-2 py-16 text-center text-muted">Пока пусто</div>
      )}
      <div className="space-y-3">
        {rows.map((r) => {
          const Icon = r.kind === "image" ? ImageIcon : generatorIcon(r.generatorSlug ?? "");
          return (
            <details key={r.id} className="card group p-4 open:bg-surface-2">
              <summary className="flex cursor-pointer list-none items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line-2 bg-white/5 text-accent">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.kind === "image" ? r.input.prompt : Object.values(r.input).filter(Boolean).join(" · ")}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {r.kind === "image" ? "Изображение" : titles[r.generatorSlug ?? ""] ?? r.generatorSlug}
                    {" · "}
                    {r.createdAt.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {r.credits} кр.
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
              </summary>
              {r.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.output} alt="" className="mt-4 max-w-sm rounded-2xl" />
              ) : (
                <div className="mt-4 border-t border-line pt-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed"><RichText text={r.output} /></div>
                  <div className="mt-3 flex gap-2">
                    <CopyButton text={toPlainText(r.output)} />
                  </div>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
