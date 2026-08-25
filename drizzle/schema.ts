import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const cards = mysqlTable(
  "cards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    publicSlug: varchar("publicSlug", { length: 80 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    jobTitle: varchar("jobTitle", { length: 180 }),
    company: varchar("company", { length: 180 }),
    bio: text("bio"),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 320 }),
    location: varchar("location", { length: 180 }),
    avatarUrl: text("avatarUrl"),
    theme: json("theme"),
    isPublished: boolean("isPublished").default(true).notNull(),
    version: int("version").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    publicSlugIdx: uniqueIndex("cards_public_slug_idx").on(table.publicSlug),
    userIdx: index("cards_user_idx").on(table.userId),
  }),
);

export const cardLinks = mysqlTable(
  "card_links",
  {
    id: int("id").autoincrement().primaryKey(),
    cardId: int("cardId").notNull(),
    platform: varchar("platform", { length: 32 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    url: text("url").notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    isVisible: boolean("isVisible").default(true).notNull(),
  },
  (table) => ({ cardIdx: index("card_links_card_idx").on(table.cardId) }),
);

export const syncChanges = mysqlTable(
  "sync_changes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    cardId: int("cardId").notNull(),
    clientMutationId: varchar("clientMutationId", { length: 96 }).notNull(),
    payload: json("payload").notNull(),
    baseVersion: int("baseVersion").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    mutationIdx: uniqueIndex("sync_mutation_idx").on(table.clientMutationId),
    userIdx: index("sync_user_idx").on(table.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;
export type CardLink = typeof cardLinks.$inferSelect;
export type InsertCardLink = typeof cardLinks.$inferInsert;
export type SyncChange = typeof syncChanges.$inferSelect;
