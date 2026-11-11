/** Форматы картинок: соцсети на телефоне (9:16, 3:4) и посты на ПК (16:9, 4:3) */
export const IMAGE_FORMATS = [
  { ratio: "1:1", hint: "Квадрат", width: 1024, height: 1024 },
  { ratio: "9:16", hint: "Сторис", width: 864, height: 1536 },
  { ratio: "16:9", hint: "Обложка", width: 1536, height: 864 },
  { ratio: "3:4", hint: "Пост в ленту", width: 1152, height: 1536 },
  { ratio: "4:3", hint: "Пост на ПК", width: 1536, height: 1152 },
] as const;

export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export const formatByRatio = (ratio: unknown): ImageFormat =>
  IMAGE_FORMATS.find((f) => f.ratio === ratio) ?? IMAGE_FORMATS[0];

export const MAX_REFS = 4;
export const MAX_REF_BYTES = 10 * 1024 * 1024;
