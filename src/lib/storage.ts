import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Тестовая версия хранит файлы на диске. В проде заменить на S3 (Yandex Object Storage / Selectel).
const DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

export async function saveFile(buf: Buffer, ext: string) {
  await mkdir(DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(DIR, name), buf);
  return `/api/files/${name}`;
}

export async function readStoredFile(name: string) {
  if (!/^[\w-]+\.(png|jpg|jpeg|webp|svg)$/.test(name)) return null;
  try {
    return await readFile(path.join(DIR, name));
  } catch {
    return null;
  }
}
