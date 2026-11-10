import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import Chat from "@/components/Chat";
import { requireUser } from "@/lib/auth";
import { modelOptions } from "@/lib/generators";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const user = await requireUser();
  const id = Number((await searchParams).c) || null;
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
  return (
    <div className="h-full">
      <Chat key={id ?? "new"} conversationId={id} initial={initial} models={await modelOptions("text", user)} initialModel={modelSlug} />
    </div>
  );
}
