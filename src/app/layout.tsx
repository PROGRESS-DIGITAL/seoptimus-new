import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "@fontsource-variable/unbounded";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "Нейросеть пишет текст онлайн бесплатно — SEOPTIMUS",
  description:
    "Генерация текстов и изображений нейросетью: SEO-тексты, статьи, рерайт, посты, карточки товаров. Бесплатно без регистрации.",
};

export const viewport: Viewport = { themeColor: "#07070b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
