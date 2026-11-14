import { galleryAll } from "@/lib/gallery";
import { saveGalleryImage, uploadGallery } from "../actions";

export default async function GalleryAdmin() {
  const items = await galleryAll();
  return (
    <div className="grid gap-4">
      <div className="card p-4">
        <h1 className="display text-xl">Галерея на главной</h1>
        <p className="mt-1 text-sm text-muted">
          Можно выбрать сразу несколько файлов. Формат (1:1, 9:16, 16:9, 3:4, 4:3) определится сам, картинки сожмутся
          для быстрой загрузки. Пока картинок нет, раздел на главной скрыт.
        </p>
        <form action={uploadGallery} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="file" name="files" accept="image/*" multiple required className="input-sm max-w-xs" />
          <input name="caption" placeholder="Подпись (необязательно)" className="input-sm min-w-60 flex-1" />
          <button className="btn btn-sm">Загрузить</button>
        </form>
      </div>
      {items.length > 0 && (
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((g) => (
            <form key={g.id} action={saveGalleryImage} className="card grid min-w-0 grid-cols-1 content-start gap-2 p-3">
              <input type="hidden" name="id" value={g.id} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt="" className={"w-full rounded-xl object-cover " + (g.enabled ? "" : "opacity-40")} style={{ aspectRatio: `${g.width} / ${g.height}` }} />
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="chip !py-0.5 !text-xs">{g.ratio}</span>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="enabled" defaultChecked={g.enabled} className="check" /> показывать
                </label>
              </div>
              <input name="caption" defaultValue={g.caption} placeholder="Подпись" className="input-sm" />
              <div className="flex gap-2">
                <input name="sort" type="number" defaultValue={g.sort} title="Порядок: меньше значит выше" className="input-sm w-14 shrink-0" />
                <button className="btn btn-sm min-w-0 flex-1 !px-2">Сохранить</button>
                <button name="delete" value="1" className="btn-ghost btn-sm shrink-0 !px-3 text-danger">Удалить</button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
