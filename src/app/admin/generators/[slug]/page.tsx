import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { saveGenerator } from "../../actions";

const inp = "input-sm w-full !py-1.5";
const lbl = "grid gap-1 text-sm font-medium";

const SAMPLE_FIELDS = JSON.stringify(
  [{ name: "topic", label: "Тема", type: "textarea", required: true }],
  null,
  2,
);

export default async function EditGenerator({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isNew = slug === "new";
  const [g] = isNew ? [] : await db.select().from(schema.generators).where(eq(schema.generators.slug, slug));
  if (!isNew && !g) notFound();
  const models = await db.select().from(schema.models).where(eq(schema.models.kind, "text"));

  return (
    <form action={saveGenerator} className="grid gap-4 card p-5">
      <h1 className="display text-xl">{isNew ? "Новый генератор" : g.title}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={lbl}>slug (латиница)<input name="slug" defaultValue={g?.slug} readOnly={!isNew} required className={inp} /></label>
        <label className={lbl}>Название<input name="title" defaultValue={g?.title} required className={inp} /></label>
        <label className={lbl}>Описание<input name="description" defaultValue={g?.description} className={inp} /></label>
        <label className={lbl}>SEO-адрес (например seo-generator, пусто = только в кабинете)<input name="publicPath" defaultValue={g?.publicPath?.slice(1) ?? ""} className={inp} /></label>
        <label className={lbl}>SEO Title<input name="seoTitle" defaultValue={g?.seoTitle ?? ""} className={inp} /></label>
        <label className={lbl}>SEO Description<input name="seoDescription" defaultValue={g?.seoDescription ?? ""} className={inp} /></label>
        <label className={lbl}>
          Модель по умолчанию
          <select name="defaultModel" defaultValue={g?.defaultModel ?? ""} className={inp}>
            <option value="">как в настройках моделей</option>
            {models.map((m) => <option key={m.slug} value={m.slug}>{m.title}</option>)}
          </select>
        </label>
        <label className={lbl}>Порядок<input type="number" name="sort" defaultValue={g?.sort ?? 0} className={inp} /></label>
      </div>
      <label className={lbl}>Системный промпт<textarea name="systemPrompt" defaultValue={g?.systemPrompt} rows={4} required className={inp} /></label>
      <label className={lbl}>
        Шаблон запроса. Подстановки полей: {"{{имя_поля}}"}
        <textarea name="promptTemplate" defaultValue={g?.promptTemplate} rows={4} required className={inp + " font-mono"} />
      </label>
      <label className={lbl}>
        Поля формы (JSON: name, label, type = text | textarea | select, options, required, placeholder)
        <textarea name="fields" defaultValue={g ? JSON.stringify(g.fields, null, 2) : SAMPLE_FIELDS} rows={12} className={inp + " font-mono text-xs"} />
      </label>
      <div className="flex gap-6 text-sm">
        <label className="flex gap-2"><input type="checkbox" name="guestAllowed" defaultChecked={g?.guestAllowed ?? true} /> Доступен гостям без регистрации</label>
        <label className="flex gap-2"><input type="checkbox" name="enabled" defaultChecked={g?.enabled ?? true} /> Включён</label>
      </div>
      <div><button className="btn">Сохранить</button></div>
    </form>
  );
}
