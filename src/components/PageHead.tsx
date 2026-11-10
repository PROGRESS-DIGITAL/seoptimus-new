export default function PageHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-8">
      <h1 className="display text-2xl sm:text-3xl">{title}</h1>
      {hint && <p className="mt-2 text-muted">{hint}</p>}
    </div>
  );
}
