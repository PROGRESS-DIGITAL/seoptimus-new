import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { generatorIcon } from "@/components/GeneratorCard";
import GeneratorForm from "@/components/GeneratorForm";
import { requireUser } from "@/lib/auth";
import { generatorBySlug, modelOptions } from "@/lib/generators";

export default async function GeneratorPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const g = await generatorBySlug((await params).slug);
  if (!g) notFound();
  const Icon = generatorIcon(g.slug);
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <Link href="/app/generators" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft className="h-4 w-4" /> Все генераторы
      </Link>
      <div className="mt-5 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="display text-2xl">{g.title}</h1>
          <p className="mt-1 text-muted">{g.description}</p>
        </div>
      </div>
      <div className="card mt-8 p-5 sm:p-7">
        <GeneratorForm slug={g.slug} fields={g.fields} models={await modelOptions("text", user)} />
      </div>
    </div>
  );
}
