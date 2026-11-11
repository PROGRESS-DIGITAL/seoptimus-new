"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, ImageIcon, LayoutGrid, MessageSquarePlus, Settings2 } from "lucide-react";

const ITEMS = [
  { href: "/app/chat", label: "Чат", icon: MessageSquarePlus },
  { href: "/app/generators", label: "Генераторы", icon: LayoutGrid },
  { href: "/app/images", label: "Изображения", icon: ImageIcon },
  { href: "/app/history", label: "История", icon: History },
  { href: "/app/billing", label: "Тариф и оплата", icon: CreditCard },
];

export function SideNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  const items = admin ? [...ITEMS, { href: "/admin", label: "Админка", icon: Settings2 }] : ITEMS;
  return (
    <nav className="grid gap-0.5 px-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition " +
              (active ? "bg-white/10 font-medium text-fg" : "text-muted hover:bg-white/5 hover:text-fg")
            }
          >
            <Icon className={"h-[18px] w-[18px] " + (active ? "text-accent" : "")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Нижняя панель на телефоне */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="pb-safe grid grid-cols-5 border-t border-line bg-surface/90 backdrop-blur-xl md:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={"grid justify-items-center gap-1 pb-1.5 pt-2 text-[10px] transition active:scale-95 " + (active ? "text-accent" : "text-muted")}
          >
            <span className={"grid h-7 w-12 place-items-center rounded-full transition " + (active ? "bg-accent/15" : "")}>
              <Icon className="h-5 w-5" />
            </span>
            {label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
