import Link from "next/link";
import {
  ArrowUpRight, FileText, MessageCircle, PenLine, Repeat2, Search, ShoppingBag, Sparkles, SpellCheck,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  text: PenLine,
  seo: Search,
  article: FileText,
  rewrite: Repeat2,
  correct: SpellCheck,
  smm: MessageCircle,
  "product-card": ShoppingBag,
};

export const generatorIcon = (slug: string) => ICONS[slug] ?? Sparkles;

export default function GeneratorCard({
  slug,
  title,
  description,
  href,
  big,
}: {
  slug: string;
  title: string;
  description: string;
  href: string;
  big?: boolean;
}) {
  const Icon = generatorIcon(slug);
  return (
    <Link
      href={href}
      className={
        "card card-hover group relative flex flex-col overflow-hidden p-5 " + (big ? "sm:col-span-2 sm:p-7" : "")
      }
    >
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent opacity-0 blur-[70px] transition duration-500 group-hover:opacity-20"
      />
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-line-2 bg-white/5 text-accent transition group-hover:bg-accent group-hover:text-accent-ink">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-5 w-5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <div className={"mt-5 font-semibold " + (big ? "display text-xl" : "text-lg")}>{title}</div>
      <div className="mt-1.5 text-sm leading-relaxed text-muted">{description}</div>
    </Link>
  );
}
