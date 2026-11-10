/** Фоновое свечение: размытые цветные пятна и сетка. Чистый CSS, без картинок. */
export default function Aurora({ subtle = false }: { subtle?: boolean }) {
  const o = subtle ? "opacity-20 sm:opacity-25" : "opacity-30 sm:opacity-50";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="grid-bg absolute inset-0" />
      <div className={`absolute -top-40 left-[8%] h-[520px] w-[520px] rounded-full bg-violet blur-[140px] ${o} animate-aurora`} />
      <div className={`absolute -top-24 right-[4%] h-[440px] w-[440px] rounded-full bg-pink blur-[150px] ${subtle ? "opacity-15" : "opacity-30"} animate-aurora-slow`} />
      <div className={`absolute top-56 left-[42%] h-[320px] w-[320px] rounded-full bg-accent blur-[150px] ${subtle ? "opacity-10" : "opacity-20"} animate-aurora`} />
    </div>
  );
}
