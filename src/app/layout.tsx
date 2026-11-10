import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "Нейросеть пишет текст онлайн бесплатно — SEOPTIMUS",
  description:
    "Генерация текстов и изображений нейросетью: SEO-тексты, статьи, рерайт, посты, карточки товаров. Бесплатно без регистрации.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
