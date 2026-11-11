import GeneratorCard from "@/components/GeneratorCard";
import PageHead from "@/components/PageHead";
import { enabledGenerators } from "@/lib/generators";

export default async function Generators() {
  const all = await enabledGenerators();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:p-10">
      <PageHead title="Генераторы" hint="Выберите инструмент, заполните форму и получите готовый текст" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((g) => (
          <GeneratorCard key={g.slug} slug={g.slug} title={g.title} description={g.description} href={`/app/generators/${g.slug}`} />
        ))}
      </div>
    </div>
  );
}
