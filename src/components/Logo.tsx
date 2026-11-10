import Link from "next/link";

export default function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={"group inline-flex items-center gap-2 " + className}>
      <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-ink transition group-hover:rotate-12">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z" />
        </svg>
      </span>
      <span className="display text-[15px] tracking-wide">SEOPTIMUS</span>
    </Link>
  );
}
