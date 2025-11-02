import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const cardTypeEnum = pgEnum("card_type", [
  "link",
  "social",
  "email",
  "text",
  "image",
  // Phase 3: lightweight, opt-in types (no heavy embeds)
  "video",
  "music",
  "map",
  "divider",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    hashedPassword: text("hashed_password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("sessions_user_id_idx").on(table.userId, table.id),
  }),
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bucket: text("bucket").notNull(),
    key: text("key").notNull(),
    contentType: text("content_type").notNull(),
    url: text("url").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    bucketKeyIdx: uniqueIndex("assets_bucket_key_idx").on(table.bucket, table.key),
  }),
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: text("handle").notNull().unique(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    // Theme JSON: we keep DB default as-is for compatibility, but widen TS type
    // to support Phase 3 presets without requiring a migration.
    theme: jsonb("theme").$type<{
      preset?: "minimal" | "studio" | "neon" | "pastel";
      accent?: string;
      background?: string;
    }>().default({ accent: "#2563eb", background: "#0f172a" }),
    avatarAssetId: uuid("avatar_asset_id").references(() => assets.id, { onDelete: "set null" }),
    bannerAssetId: uuid("banner_asset_id").references(() => assets.id, { onDelete: "set null" }),
    clicks: integer("clicks").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: false }),
  },
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: cardTypeEnum("type").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    url: text("url"),
    icon: text("icon"),
    cols: integer("cols").default(3).notNull(),
    rows: integer("rows").default(1).notNull(),
    position: integer("position").notNull(),
    data: jsonb("data"),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
    accentColor: text("accent_color"),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
  },
  (table) => ({
    orderIdx: uniqueIndex("cards_profile_position_idx").on(table.profileId, table.position),
  }),
);

export const cardsRelations = relations(cards, ({ one }) => ({
  profile: one(profiles, {
    fields: [cards.profileId],
    references: [profiles.id],
  }),
  asset: one(assets, {
    fields: [cards.assetId],
    references: [assets.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  cards: many(cards),
  avatarAsset: one(assets, {
    fields: [profiles.avatarAssetId],
    references: [assets.id],
  }),
  bannerAsset: one(assets, {
    fields: [profiles.bannerAssetId],
    references: [assets.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Card = typeof cards.$inferSelect;

// Phase 1: audit logs and simple rate limits
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: false }).notNull(),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("rate_limits_action_key_window_idx").on(t.action, t.key, t.windowStart),
  }),
);
