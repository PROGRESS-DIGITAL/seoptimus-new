"use client";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

/* Переключатель темы админки: меняет класс на корне админки и запоминает выбор в cookie */
export default function ThemeToggle({ initial }: { initial: "dark" | "light" }) {
  const [theme, setTheme] = useState(initial);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.getElementById("admin-root")?.classList.toggle("theme-light", next === "light");
    document.cookie = `admin_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  const light = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Включить тёмную тему" : "Включить светлую тему"}
      title={light ? "Тёмная тема" : "Светлая тема"}
      className="ml-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-[11px] border border-line-2 px-3 text-sm text-fg transition hover:bg-white/5"
    >
      {light ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      <span>{light ? "Тёмная тема" : "Светлая тема"}</span>
    </button>
  );
}
