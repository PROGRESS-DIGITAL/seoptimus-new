"use client";

import { CornerDownRight } from "lucide-react";

export default function Suggestions({
  items,
  loading,
  onPick,
}: {
  items: string[];
  loading?: boolean;
  onPick: (s: string) => void;
}) {
  if (loading)
    return (
      <div className="flex flex-wrap gap-2" aria-label="Подбираю варианты продолжения">
        {[120, 160, 140].map((w) => (
          <div key={w} className="shimmer h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>
    );
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="chip chip-btn animate-rise !border-accent/25 !text-fg/90 hover:!bg-accent/10"
        >
          <CornerDownRight className="h-3.5 w-3.5 text-accent" />
          {s}
        </button>
      ))}
    </div>
  );
}
