import { notFound } from "next/navigation";
import GeneratorForm from "@/components/GeneratorForm";
import { requireUser } from "@/lib/auth";
import { generatorBySlug, modelOptions } from "@/lib/generators";

export default async function GeneratorPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const g = await generatorBySlug((await params).slug);
  if (!g) notFound();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">{g.title}</h1>
      <p className="mt-1 text-slate-600">{g.description}</p>
      <div className="mt-6">
        <GeneratorForm slug={g.slug} fields={g.fields} models={await modelOptions("text", user)} />
      </div>
    </div>
  );
}
