import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GeneratorForm from "@/components/GeneratorForm";
import { getUser } from "@/lib/auth";
import { generatorByPath, modelOptions } from "@/lib/generators";
import { guestRemaining } from "@/lib/guest";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** SEO-страницы генераторов на старых адресах: /seo-generator, /text-rewriter и т. д. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = await generatorByPath("/" + (await params).slug);
  if (!g) return {};
  return {
    title: g.seoTitle ?? `${g.title} — SEOPTIMUS`,
    description: g.seoDescription ?? g.description,
    alternates: { canonical: g.publicPath! },
  };
}

export default async function GeneratorPage({ params }: Props) {
  const g = await generatorByPath("/" + (await params).slug);
  if (!g) notFound();
  const user = await getUser();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{g.title}</h1>
      <p className="mt-2 text-slate-600">{g.description}</p>
      <div className="mt-6 rounded-2xl border border-slate-200 p-5 shadow-sm">
        <GeneratorForm
          slug={g.slug}
          fields={g.fields}
          guest={!user}
          guestRemaining={user ? 0 : await guestRemaining()}
          models={user ? await modelOptions("text", user) : undefined}
        />
      </div>
    </div>
  );
}
