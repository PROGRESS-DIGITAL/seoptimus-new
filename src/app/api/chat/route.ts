import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { isDemoMode, providerFor, type ChatMessage } from "@/lib/ai/gateway";
import { chargeUpTo, textCost } from "@/lib/billing";
import { errMessage, jsonError, textStream } from "@/lib/http";
import { resolveModel } from "@/lib/models";
import { META_SEP } from "@/lib/stream-meta";
import { HUMAN_STYLE_CHAT, lengthRule, lengthTarget } from "@/lib/human-style";
import { dropPlaceholders, toPlainText } from "@/lib/plain-text";
import { suggestFollowUps } from "@/lib/suggest";
import { renderTemplate } from "@/lib/prompt";

export const runtime = "nodejs";

const SYSTEM =
  "Ты ассистент сервиса SEOPTIMUS для текстов и контента. Отвечай на языке пользователя.";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return jsonError("Войдите в аккаунт", 401);
    const body = await req.json();
    const text = String(body.message ?? "").trim().slice(0, 30000);
    if (!text) return jsonError("Пустое сообщение");
    const model = await resolveModel("text", body.model, user);
    if (user.credits < model.minCredits) return jsonError("Недостаточно кредитов", 402);

    let convId = Number(body.conversationId) || 0;
    if (convId) {
      const [c] = await db
        .select()
        .from(schema.conversations)
        .where(and(eq(schema.conversations.id, convId), eq(schema.conversations.userId, user.id)));
      if (!c) return jsonError("Чат не найден", 404);
    } else {
      const [c] = await db
        .insert(schema.conversations)
        .values({ userId: user.id, title: text.slice(0, 60), modelSlug: model.slug })
        .returning();
      convId = c.id;
      // Продолжение результата генератора: кладём запрос и ответ в начало чата
      const genId = Number(body.fromGeneration) || 0;
      if (genId) {
        const [g] = await db
          .select()
          .from(schema.generations)
          .where(and(eq(schema.generations.id, genId), eq(schema.generations.userId, user.id)));
        if (g && g.kind === "text") {
          const [tpl] = g.generatorSlug
            ? await db.select().from(schema.generators).where(eq(schema.generators.slug, g.generatorSlug))
            : [];
          const asked = tpl ? renderTemplate(tpl.promptTemplate, g.input) : Object.values(g.input).join("\n");
          await db.insert(schema.messages).values([
            { conversationId: convId, role: "user", content: asked },
            { conversationId: convId, role: "assistant", content: g.output, modelSlug: g.modelSlug },
          ]);
          await db
            .update(schema.conversations)
            .set({ title: (tpl?.title ? `${tpl.title}: ` : "") + text.slice(0, 50) })
            .where(eq(schema.conversations.id, convId));
        }
      }
    }

    const history = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, convId))
      .orderBy(asc(schema.messages.id));
    await db.insert(schema.messages).values({ conversationId: convId, role: "user", content: text });

    const target = lengthTarget({ text });
    // Последние 30 сообщений как контекст
    const context: ChatMessage[] = [
      { role: "system", content: `${SYSTEM}\n\n${HUMAN_STYLE_CHAT}` },
      ...history.slice(-30).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
      // Если в запросе назван объём («статья на 3000 знаков»), напоминаем модели о нём
      { role: "user", content: text + lengthRule(target, false) },
    ];

    return textStream(
      async (write, signal) => {
        const provider = providerFor(model);
        const result = await provider.streamChat(model, context, write, { maxTokens: 16000, signal });
        // Как в генераторах: если текст вышел заметно короче запрошенного, просим дописать (до 2 раз)
        for (let i = 0; i < 2 && !isDemoMode() && target && target.min >= 800 && result.text.length < target.min * 0.85 && !signal.aborted; i++) {
          write("\n\n");
          const more = await provider.streamChat(
            model,
            [
              ...context,
              { role: "assistant", content: result.text },
              {
                role: "user",
                content: `Текст получился короче нужного: ${result.text.length} знаков из ${target.min}. Продолжи с того места, где остановился, не повторяя уже написанное. Допиши ещё примерно ${target.min - result.text.length} знаков в том же стиле. Выдай только продолжение.`,
              },
            ],
            write,
            { maxTokens: 16000, signal },
          );
          if (!more.text.trim()) break;
          result.text = `${result.text.trimEnd()}\n\n${more.text.trim()}`;
          result.tokens += more.tokens;
          result.tokensIn += more.tokensIn;
          result.tokensOut += more.tokensOut;
        }
        // В выдаче и в истории только чистый текст, без звёздочек и заготовок в скобках
        result.text = dropPlaceholders(toPlainText(result.text));
        const credits = await chargeUpTo(user.id, await textCost(model, result.tokensIn, result.tokensOut), "chat", String(convId));
        await db.insert(schema.messages).values({
          conversationId: convId,
          role: "assistant",
          content: result.text,
          modelSlug: model.slug,
          credits,
        });
        await db
          .update(schema.conversations)
          .set({ updatedAt: new Date(), modelSlug: model.slug })
          .where(eq(schema.conversations.id, convId));
        if (result.text.trim()) {
          write(META_SEP); // клиент сразу покажет, что подбираются варианты
          const suggestions = await suggestFollowUps(text, result.text);
          write(JSON.stringify({ suggestions, text: result.text }));
        }
      },
      req.signal,
      { "X-Conversation-Id": String(convId) },
    );
  } catch (e) {
    return jsonError(errMessage(e));
  }
}
