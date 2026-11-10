import { sql } from "drizzle-orm";
import { db } from "@/db";

async function one<T>(q: ReturnType<typeof sql>) {
  const rows = await db.execute(q);
  return rows[0] as T;
}

export default async function AdminHome() {
  const s = await one<Record<string, number>>(sql`
    select
      (select count(*) from users)::int as users,
      (select count(*) from users where created_at > now() - interval '7 days')::int as users7,
      (select count(*) from users where plan_until > now())::int as paying,
      (select coalesce(sum(amount),0) from payments where created_at > now() - interval '30 days')::int as revenue30,
      (select count(*) from generations where created_at > now() - interval '1 day')::int as gen24,
      (select count(*) from generations where user_id is null and created_at > now() - interval '1 day')::int as guest24,
      (select count(*) from messages where role = 'assistant' and created_at > now() - interval '1 day')::int as chat24
  `);
  const byModel = await db.execute<{ model: string; credits: number; tokens: number; n: number }>(sql`
    select model_slug as model, sum(credits)::int as credits, sum(tokens)::int as tokens, count(*)::int as n
    from generations where created_at > now() - interval '30 days' group by 1 order by 2 desc
  `);
  const cards: [string, number | string][] = [
    ["Пользователей", s.users],
    ["Новых за 7 дней", s.users7],
    ["С активной подпиской", s.paying],
    ["Выручка за 30 дней, ₽", s.revenue30.toLocaleString("ru-RU")],
    ["Генераций за сутки", s.gen24],
    ["Из них гостевых", s.guest24],
    ["Ответов в чате за сутки", s.chat24],
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card p-5">
            <div className="text-sm text-muted">{label}</div>
            <div className="display mt-2 text-3xl">{value}</div>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h2 className="display text-lg">Генерации по моделям за 30 дней</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-muted">
            <tr><th>Модель</th><th>Запросов</th><th>Токенов</th><th>Списано кредитов</th></tr>
          </thead>
          <tbody>
            {byModel.map((r) => (
              <tr key={r.model} className="border-t border-line">
                <td className="py-1.5">{r.model}</td><td>{r.n}</td><td>{r.tokens}</td><td>{r.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
