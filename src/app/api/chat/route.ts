import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { providerFor, type ChatMessage } from "@/lib/ai/gateway";
import { chargeUpTo, textCost } from "@/lib/billing";
import { errMessage, jsonError, textStream } from "@/lib/http";
import { resolveModel } from "@/lib/models";
import { META_SEP } from "@/lib/stream-meta";
import { suggestFollowUps } from "@/lib/suggest";
import { renderTemplate } from "@/lib/prompt";

export const runtime = "nodejs";

const SYSTEM =
  "Ты полезный ассистент сервиса SEOPTIMUS. Отвечай на языке пользователя, по делу и структурно.";

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

    // Последние 30 сообщений как контекст
    const context: ChatMessage[] = [
      { role: "system", content: SYSTEM },
      ...history.slice(-30).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
      { role: "user", content: text },
    ];

    return textStream(
      async (write, signal) => {
        const result = await providerFor(model).streamChat(model, context, write, { signal });
        const credits = await chargeUpTo(user.id, textCost(model, result.tokens), "chat", String(convId));
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
          write(JSON.stringify({ suggestions }));
        }
      },
      req.signal,
      { "X-Conversation-Id": String(convId) },
    );
  } catch (e) {
    return jsonError(errMessage(e));
  }
}
