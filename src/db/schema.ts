import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  primaryKey,
  index,
  uniqueIndex,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    credits: integer("credits").notNull().default(0),
    planSlug: text("plan_slug"),
    planUntil: timestamp("plan_until", { withTimezone: true }),
    blocked: boolean("blocked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const loginCodes = pgTable("login_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const plans = pgTable("plans", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  priceRub: integer("price_rub").notNull(),
  monthlyCredits: integer("monthly_credits").notNull(),
  description: text("description").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

/** Модели нейросетей. Добавляются и настраиваются из админки. */
export const models = pgTable("models", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  provider: text("provider").notNull().default("openai"),
  /** Имя модели у провайдера, например gpt-5-mini */
  providerModel: text("provider_model").notNull(),
  kind: text("kind", { enum: ["text", "image"] }).notNull(),
  /** Устарело: цена в кредитах теперь считается от costIn/costOut с наценкой (lib/economics) */
  creditPrice: integer("credit_price").notNull().default(0),
  /** Наши затраты у провайдера, USD. Текст: за 1 млн входных токенов. Картинки: за 1 референс */
  costIn: doublePrecision("cost_in").notNull().default(0),
  /** Текст: USD за 1 млн выходных токенов (включая «размышления»). Картинки: USD за 1 изображение */
  costOut: doublePrecision("cost_out").notNull().default(0),
  /** Минимальное списание за запрос */
  minCredits: integer("min_credits").notNull().default(1),
  /** Доступна ли модель без подписки (бесплатным и гостям) */
  freeAccess: boolean("free_access").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export type GeneratorField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  /** Поле в половину ширины формы (два поля в ряд на компьютере) */
  half?: boolean;
  /** Значение по умолчанию для списка */
  default?: string;
  options?: string[];
  required?: boolean;
};

/** Генераторы: формы с шаблоном промпта. Редактируются в админке. */
export const generators = pgTable("generators", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  /** Публичный URL SEO-страницы (сохраняем старые адреса), например /seo-generator */
  publicPath: text("public_path"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  fields: jsonb("fields").$type<GeneratorField[]>().notNull(),
  systemPrompt: text("system_prompt").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  defaultModel: text("default_model"),
  guestAllowed: boolean("guest_allowed").notNull().default(true),
  enabled: boolean("enabled").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    title: text("title").notNull().default("Новый чат"),
    modelSlug: text("model_slug"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conversations_user_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    modelSlug: text("model_slug"),
    credits: integer("credits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conv_idx").on(t.conversationId)],
);

/** История генераций (генераторы и картинки), включая гостевые */
export const generations = pgTable(
  "generations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    guestKey: text("guest_key"),
    kind: text("kind", { enum: ["text", "image"] }).notNull(),
    generatorSlug: text("generator_slug"),
    modelSlug: text("model_slug").notNull(),
    input: jsonb("input").$type<Record<string, string>>().notNull(),
    output: text("output").notNull(),
    tokens: integer("tokens").notNull().default(0),
    credits: integer("credits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("generations_user_idx").on(t.userId)],
);

/** Журнал движения кредитов */
export const ledger = pgTable(
  "ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    ref: text("ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ledger_user_idx").on(t.userId)],
);

export const guestUsage = pgTable(
  "guest_usage",
  {
    key: text("key").notNull(),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.day] })],
);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  planSlug: text("plan_slug"),
  amount: integer("amount").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  subscriptionId: text("subscription_id"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Генерация картинки идёт в фоне: браузер получает id и опрашивает статус,
 *  поэтому обрыв связи или таймаут прокси не теряют результат */
export const imageJobs = pgTable("image_jobs", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "done", "error"] }).notNull().default("pending"),
  ratio: text("ratio").notNull(),
  url: text("url"),
  error: text("error"),
  credits: integer("credits").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Картинки для галереи на главной, загружаются в админке */
export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  ratio: text("ratio").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  caption: text("caption").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Model = typeof models.$inferSelect;
export type Generator = typeof generators.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
