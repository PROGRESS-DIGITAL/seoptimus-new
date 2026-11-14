import type { GalleryImage } from "@/db/schema";

/** Плитка «кирпичами»: у картинок разные пропорции, колонки сами выравнивают высоту */
export default function HomeGallery({ items }: { items: GalleryImage[] }) {
  return (
    <div className="mt-10 columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
      {items.map((g) => (
        <figure key={g.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface-2 sm:mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={g.url}
            alt={g.caption || "Картинка, созданная нейросетью SEOPTIMUS"}
            width={g.width}
            height={g.height}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full transition duration-500 group-hover:scale-[1.03]"
          />
          {g.caption && (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-xs leading-snug text-white opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
              {g.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
