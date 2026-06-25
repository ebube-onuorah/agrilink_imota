// Messaging + notification queries (FR-06, FR-08).

import { and, or, eq, desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { messages, produceListings, users, systemNotifications } from "@/server/db/schema";

export type ThreadSummary = {
  listingId: number;
  commodityName: string;
  counterpartId: number;
  counterpartName: string;
  lastMessage: string;
  lastAt: Date;
  unread: number;
};

/** Group all of a user's messages into conversation threads (listing + counterpart). */
export async function getInbox(userId: number): Promise<ThreadSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: messages.id,
      listingId: messages.listingId,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      body: messages.messageBody,
      sentAt: messages.sentAt,
      isRead: messages.isRead,
      commodityName: produceListings.commodityName,
    })
    .from(messages)
    .leftJoin(produceListings, eq(messages.listingId, produceListings.id))
    .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
    .orderBy(desc(messages.sentAt));

  const counterpartIds = new Set<number>();
  for (const r of rows) counterpartIds.add(r.senderId === userId ? r.recipientId : r.senderId);
  const nameById = await namesFor(counterpartIds);

  const threads = new Map<string, ThreadSummary>();
  for (const r of rows) {
    const counterpartId = r.senderId === userId ? r.recipientId : r.senderId;
    const key = `${r.listingId}:${counterpartId}`;
    const existing = threads.get(key);
    const unreadInc = r.recipientId === userId && !r.isRead ? 1 : 0;
    if (!existing) {
      threads.set(key, {
        listingId: r.listingId,
        commodityName: r.commodityName ?? "Listing",
        counterpartId,
        counterpartName: nameById.get(counterpartId) ?? "User",
        lastMessage: r.body,
        lastAt: r.sentAt,
        unread: unreadInc,
      });
    } else {
      existing.unread += unreadInc;
    }
  }
  return [...threads.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

async function namesFor(ids: Set<number>): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (ids.size === 0) return map;
  const db = await getDb();
  const all = await db.select({ id: users.id, name: users.fullName }).from(users);
  for (const u of all) if (ids.has(u.id)) map.set(u.id, u.name);
  return map;
}

export async function getThread(userId: number, listingId: number, counterpartId: number) {
  const db = await getDb();
  const thread = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.listingId, listingId),
        or(
          and(eq(messages.senderId, userId), eq(messages.recipientId, counterpartId)),
          and(eq(messages.senderId, counterpartId), eq(messages.recipientId, userId)),
        ),
      ),
    )
    .orderBy(messages.sentAt);
  return thread;
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  return db
    .select()
    .from(systemNotifications)
    .where(eq(systemNotifications.userId, userId))
    .orderBy(desc(systemNotifications.createdAt));
}
