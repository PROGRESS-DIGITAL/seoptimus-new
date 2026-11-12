"use client";

import { useState } from "react";
import GeneratorForm from "@/components/GeneratorForm";
import type { GeneratorField } from "@/db/schema";

export type HeroTab = { slug: string; tab: string; title: string; hint: string; fields: GeneratorField[] };

/**
 * Генератор на первом экране с вкладками. Все формы есть в разметке сразу (поисковики видят все
 * инструменты), неактивные просто скрыты, а введённый текст не теряется при переключении.
 */
export default function HeroGenerators({
  tabs,
  guest,
  guestRemaining,
}: {
  tabs: HeroTab[];
  guest: boolean;
  guestRemaining: number;
}) {
  const [active, setActive] = useState(tabs[0]?.slug);
  return (
    <div data-hero-tabs>
      <div
        role="tablist"
        aria-label="Инструменты"
        className="-mx-1 mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white/[0.03] p-1 [scrollbar-width:none]"
      >
        {tabs.map((t) => {
          const on = t.slug === active;
          return (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={on}
              data-tab={t.slug}
              onClick={() => setActive(t.slug)}
              className={
                "min-h-10 flex-1 cursor-pointer whitespace-nowrap rounded-xl px-3.5 text-sm transition " +
                (on ? "bg-accent font-semibold text-accent-ink shadow-[0_0_24px_-8px] shadow-accent" : "text-muted hover:bg-white/5 hover:text-fg")
              }
            >
              {t.tab}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.slug} role="tabpanel" data-panel={t.slug} hidden={t.slug !== active}>
          <div className="mb-4">
            <div className="display text-lg">{t.title}</div>
            <div className="mt-0.5 text-sm text-muted">{t.hint}</div>
          </div>
          <GeneratorForm slug={t.slug} fields={t.fields} guest={guest} guestRemaining={guestRemaining} />
        </div>
      ))}
    </div>
  );
}
