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
import { HUMAN_STYLE, cleanAiTails, lengthRule, lengthTarget, randomOpening } from "@/lib/human-style";
import { isDemoMode, type ChatMessage } from "@/lib/ai/gateway";
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

    const target = lengthTarget(input);
    const rewrite = !!input.source?.trim();
    const prompt =
      renderTemplate(gen.promptTemplate, input) +
      lengthRule(target, rewrite) +
      (!rewrite && (target?.min ?? 0) >= 800 ? `\n\n${randomOpening()}` : "");
    return textStream(
      async (write, signal) => {
        const messages: ChatMessage[] = [
          { role: "system", content: `${gen.systemPrompt}\n\n${HUMAN_STYLE}` },
          { role: "user", content: prompt },
        ];
        const maxTokens = user ? 16000 : 6000;
        const provider = providerFor(model);
        let result = await provider.streamChat(model, messages, write, { maxTokens, signal });
        let text = result.text;
        let tokens = result.tokens;
        let tokensIn = result.tokensIn;
        let tokensOut = result.tokensOut;
        // Длинный текст по частям: если вышло заметно короче нужного, просим дописать (до 2 раз)
        for (let i = 0; i < 2 && !isDemoMode() && target && target.min >= 800 && text.length < target.min * 0.85 && !signal.aborted; i++) {
          const need = target.min - text.length;
          write("\n\n");
          const more = await provider.streamChat(
            model,
            [
              ...messages,
              { role: "assistant", content: text },
              {
                role: "user",
                content: `Текст получился короче нужного: ${text.length} знаков из ${target.min}. Продолжи с того места, где остановился, не повторяя уже написанное. Допиши ещё примерно ${need} знаков в том же стиле. Выдай только продолжение.`,
              },
            ],
            write,
            { maxTokens, signal },
          );
          if (!more.text.trim()) break;
          text = `${text.trimEnd()}\n\n${more.text.trim()}`;
          tokens += more.tokens;
          tokensIn += more.tokensIn;
          tokensOut += more.tokensOut;
        }
        const clean = cleanAiTails(text);
        result = { text: clean, tokens, tokensIn, tokensOut };
        const credits = user ? await chargeUpTo(user.id, await textCost(model, result.tokensIn, result.tokensOut), "generate", gen.slug) : 0;
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
          write(JSON.stringify({ suggestions, generationId: user ? row.id : undefined, text: clean }));
        }
      },
      req.signal,
      { "X-Model": model.slug },
    );
  } catch (e) {
    return jsonError(errMessage(e));
  }
}
