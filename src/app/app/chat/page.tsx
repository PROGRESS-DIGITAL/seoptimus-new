import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import Chat from "@/components/Chat";
import { requireUser } from "@/lib/auth";
import { modelOptions } from "@/lib/generators";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ c?: string; gen?: string; q?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const id = Number(sp.c) || null;
  const genId = !id ? Number(sp.gen) || 0 : 0;
  let initial: { role: "user" | "assistant"; content: string }[] = [];
  let modelSlug: string | null = null;
  if (id) {
    const [conv] = await db
      .select()
      .from(schema.conversations)
      .where(and(eq(schema.conversations.id, id), eq(schema.conversations.userId, user.id)));
    if (conv) {
      modelSlug = conv.modelSlug;
      const rows = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, id))
        .orderBy(asc(schema.messages.id));
      initial = rows.filter((m) => m.role !== "system").map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    }
  }
  // Переход из генератора: показываем результат и сразу отправляем выбранный вариант
  if (genId) {
    const [g] = await db
      .select()
      .from(schema.generations)
      .where(and(eq(schema.generations.id, genId), eq(schema.generations.userId, user.id)));
    if (g?.kind === "text") {
      initial = [
        { role: "user", content: Object.values(g.input).filter(Boolean).join("\n") },
        { role: "assistant", content: g.output },
      ];
      modelSlug = g.modelSlug;
    }
  }
  return (
    <div className="h-full">
      <Chat conversationId={id} initial={initial} models={await modelOptions("text", user)} initialModel={modelSlug}
        fromGeneration={genId && initial.length ? genId : undefined}
        autoSend={genId && initial.length ? sp.q?.slice(0, 500) : undefined}
      />
    </div>
  );
}
