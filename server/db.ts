import { and, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { cards, cardLinks, InsertUser, users, syncChanges } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCards(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cards).where(eq(cards.userId, userId)).orderBy(desc(cards.updatedAt));
}

export async function getCardById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cards).where(and(eq(cards.id, id), eq(cards.userId, userId))).limit(1);
  if (!result[0]) return undefined;
  const links = await db.select().from(cardLinks).where(eq(cardLinks.cardId, id));
  return { ...result[0], links };
}

export async function getPublicCardBySlug(publicSlug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cards).where(and(eq(cards.publicSlug, publicSlug), eq(cards.isPublished, true))).limit(1);
  if (!result[0]) return undefined;
  const links = await db.select().from(cardLinks).where(and(eq(cardLinks.cardId, result[0].id), eq(cardLinks.isVisible, true)));
  return { ...result[0], links };
}

export async function createCard(userId: number, input: Omit<typeof cards.$inferInsert, "userId">, links: Array<Omit<typeof cardLinks.$inferInsert, "cardId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cards).values({ ...input, userId });
  const cardId = Number(result[0].insertId);
  if (links.length) await db.insert(cardLinks).values(links.map((link) => ({ ...link, cardId })));
  return getCardById(cardId, userId);
}

export async function updateCard(userId: number, cardId: number, input: Partial<Omit<typeof cards.$inferInsert, "userId" | "id">>, links: Array<Omit<typeof cardLinks.$inferInsert, "cardId" | "id">>, clientMutationId?: string, baseVersion = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getCardById(cardId, userId);
  if (!existing) throw new Error("Card not found");
  await db.update(cards).set({ ...input, version: existing.version + 1 }).where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
  await db.delete(cardLinks).where(eq(cardLinks.cardId, cardId));
  if (links.length) await db.insert(cardLinks).values(links.map((link) => ({ ...link, cardId })));
  if (clientMutationId) {
    await db.insert(syncChanges).values({ userId, cardId, clientMutationId, payload: { input, links }, baseVersion });
  }
  return getCardById(cardId, userId);
}

export async function getChangesSince(userId: number, version: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(syncChanges).where(and(eq(syncChanges.userId, userId), gt(syncChanges.baseVersion, version))).orderBy(syncChanges.createdAt);
}
