import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Aurora from "@/components/Aurora";
import GeneratorCard, { generatorIcon } from "@/components/GeneratorCard";
import GeneratorForm from "@/components/GeneratorForm";
import { getUser } from "@/lib/auth";
import { enabledGenerators, generatorByPath, modelOptions } from "@/lib/generators";
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
  const [user, all] = await Promise.all([getUser(), enabledGenerators()]);
  const Icon = generatorIcon(g.slug);
  const others = all.filter((o) => o.slug !== g.slug && o.publicPath).slice(0, 4);

  return (
    <div className="relative overflow-hidden">
      <Aurora subtle />
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-10">
        <nav className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-fg">Главная</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-fg">{g.title}</span>
        </nav>
        <div className="mt-8 flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink">
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="display text-3xl sm:text-4xl">{g.title}</h1>
            <p className="mt-2 text-lg text-muted">{g.description}</p>
          </div>
        </div>
        <div className="glow mt-8 rounded-3xl">
          <div className="glass p-5 sm:p-7">
            <GeneratorForm
              slug={g.slug}
              fields={g.fields}
              guest={!user}
              guestRemaining={user ? 0 : await guestRemaining()}
              models={user ? await modelOptions("text", user) : undefined}
            />
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div className="wrap pt-14">
          <h2 className="display text-2xl">Другие генераторы</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <GeneratorCard key={o.slug} slug={o.slug} title={o.title} description={o.description} href={o.publicPath!} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
