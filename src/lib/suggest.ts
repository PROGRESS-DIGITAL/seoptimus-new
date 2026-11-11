import "server-only";
import { isDemoMode, providerFor } from "./ai/gateway";
import { resolveModel } from "./models";

const DEMO = ["Сделай короче", "Добавь примеры", "Перепиши живее"];

/**
 * 2–3 варианта, что попросить дальше. Пишет бесплатная модель по умолчанию,
 * пользователю не списывается. Любая ошибка: просто без подсказок.
 */
export async function suggestFollowUps(request: string, answer: string): Promise<string[]> {
  if (isDemoMode()) return DEMO;
  try {
    const model = await resolveModel("text", null, null);
    const { text } = await providerFor(model).streamChat(
      model,
      [
        {
          role: "system",
          content:
            "Ты предлагаешь пользователю, что попросить дальше, чтобы продолжить работу с ответом нейросети. " +
            "Дай 3 варианта на языке пользователя, каждый до 45 знаков, от лица пользователя в повелительном наклонении " +
            "(например: «Сделай короче», «Добавь призыв к действию», «Придумай 5 заголовков к этому»). " +
            "Варианты должны быть конкретными для этого ответа и разными по смыслу. " +
            'Ответь строго JSON-массивом строк без пояснений, например ["…","…","…"].',
        },
        {
          role: "user",
          content: `Запрос пользователя:\n${request.slice(0, 1500)}\n\nОтвет нейросети:\n${answer.slice(0, 3000)}`,
        },
      ],
      () => {},
      { maxTokens: 1200 },
    );
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const list = JSON.parse(json);
    if (!Array.isArray(list)) return [];
    return list
      .map((s) => String(s).trim().replace(/^[«"]|[»"]$/g, ""))
      .filter((s) => s && s.length <= 80)
      .slice(0, 3);
  } catch (e) {
    console.error("[suggest]", e);
    return [];
  }
}
