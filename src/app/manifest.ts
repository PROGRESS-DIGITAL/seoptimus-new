import type { MetadataRoute } from "next";

/** Установка на телефон как приложение: открывается сразу в чате, без адресной строки */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEOPTIMUS",
    short_name: "SEOPTIMUS",
    description: "Тексты и изображения нейросетью",
    lang: "ru",
    start_url: "/app/chat?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07070b",
    theme_color: "#07070b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Новый чат", url: "/app/chat" },
      { name: "Изображения", url: "/app/images" },
      { name: "Генераторы", url: "/app/generators" },
    ],
  };
}
