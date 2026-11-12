"use client";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

/* Переключатель темы кабинета и админки: меняет класс на корне раздела и запоминает выбор в cookie */
export default function ThemeToggle({
  initial,
  variant = "full",
  className = "",
}: {
  initial: "dark" | "light";
  variant?: "full" | "icon";
  className?: string;
}) {
  const [theme, setTheme] = useState(initial);
  const light = theme === "light";
  const toggle = () => {
    const next = light ? "dark" : "light";
    setTheme(next);
    document.querySelectorAll("[data-theme-root]").forEach((el) => el.classList.toggle("theme-light", next === "light"));
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = "admin_theme=; path=/; max-age=0";
  };
  const Icon = light ? Moon : Sun;
  const label = light ? "Тёмная тема" : "Светлая тема";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Включить тёмную тему" : "Включить светлую тему"}
      title={label}
      className={
        (variant === "icon"
          ? "grid h-9 w-9 place-items-center rounded-[10px] border border-line-2 text-muted "
          : "inline-flex h-10 items-center gap-2 rounded-[11px] border border-line-2 px-3 text-sm text-fg ") +
        "cursor-pointer transition hover:bg-white/5 hover:text-fg " +
        className
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      {variant === "full" && <span>{label}</span>}
    </button>
  );
}
