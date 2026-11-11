import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { providerFor } from "@/lib/ai/gateway";
import { chargeUpTo, textCost } from "@/lib/billing";
import { consumeGuest } from "@/lib/guest";
import { errMessage, jsonError, textStream } from "@/lib/http";
import { resolveModel } from "@/lib/models";
import { renderTemplate, validateInput } from "@/lib/prompt";
import { META_SEP } from "@/lib/stream-meta";
import { suggestFollowUps } from "@/lib/suggest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await getUser();
    const [gen] = await db
      .select()
      .from(schema.generators)
      .where(eq(schema.generators.slug, String(body.generator ?? "")));
    if (!gen || !gen.enabled) return jsonError("Генератор не найден", 404);

    const input = validateInput(gen.fields, body.input ?? {});
    let guestKey: string | null = null;
    let model;
    if (!user) {
      if (!gen.guestAllowed) return jsonError("Войдите, чтобы пользоваться этим генератором", 401);
      model = await resolveModel("text", null, null); // гостям только бесплатная модель по умолчанию
      guestKey = await consumeGuest();
    } else {
      model = await resolveModel("text", body.model || gen.defaultModel, user);
      if (user.credits < model.minCredits)
        return jsonError("Недостаточно кредитов. Пополните баланс или выберите модель дешевле.", 402);
    }

    const prompt = renderTemplate(gen.promptTemplate, input);
    return textStream(
      async (write, signal) => {
        const result = await providerFor(model).streamChat(
          model,
          [
            { role: "system", content: gen.systemPrompt },
            { role: "user", content: prompt },
          ],
          write,
          { maxTokens: user ? 8000 : 2000, signal },
        );
        const credits = user ? await chargeUpTo(user.id, textCost(model, result.tokens), "generate", gen.slug) : 0;
        const [row] = await db.insert(schema.generations).values({
          userId: user?.id ?? null,
          guestKey,
          kind: "text",
          generatorSlug: gen.slug,
          modelSlug: model.slug,
          input,
          output: result.text,
          tokens: result.tokens,
          credits,
        }).returning({ id: schema.generations.id });
        if (result.text.trim()) {
          write(META_SEP); // клиент сразу покажет, что подбираются варианты
          const suggestions = await suggestFollowUps(prompt, result.text);
          write(JSON.stringify({ suggestions, generationId: user ? row.id : undefined }));
        }
      },
      req.signal,
      { "X-Model": model.slug },
    );
  } catch (e) {
    return jsonError(errMessage(e));
  }
}
