// Reusable read queries shared across dashboards and pages.

import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  produceListings,
  transactions,
  userRatings,
  commodityCategories,
  users,
} from "@/server/db/schema";

export async function getCredibility(userId: number): Promise<{ avg: number; count: number }> {
  const db = await getDb();
  const [row] = await db
    .select({
      avg: sql<number>`coalesce(avg(${userRatings.ratingScore}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(userRatings)
    .where(eq(userRatings.rateeId, userId));
  return { avg: Number(row?.avg ?? 0), count: Number(row?.count ?? 0) };
}

export async function getFarmerListings(farmerId: number) {
  const db = await getDb();
  return db
    .select({
      id: produceListings.id,
      commodityName: produceListings.commodityName,
      quantityAvailableKg: produceListings.quantityAvailableKg,
      askingPricePerKg: produceListings.askingPricePerKg,
      listingStatus: produceListings.listingStatus,
      createdAt: produceListings.createdAt,
      category: commodityCategories.categoryName,
    })
    .from(produceListings)
    .leftJoin(commodityCategories, eq(produceListings.categoryId, commodityCategories.id))
    .where(eq(produceListings.farmerId, farmerId))
    .orderBy(desc(produceListings.createdAt));
}

export async function getFarmerStats(farmerId: number) {
  const db = await getDb();
  const [active] = await db
    .select({ n: sql<number>`count(*)` })
    .from(produceListings)
    .where(and(eq(produceListings.farmerId, farmerId), eq(produceListings.listingStatus, "active")));
  const [completed] = await db
    .select({ n: sql<number>`count(*)` })
    .from(transactions)
    .where(
      and(eq(transactions.farmerId, farmerId), eq(transactions.transactionStatus, "completed")),
    );
  const credibility = await getCredibility(farmerId);
  return {
    activeListings: Number(active?.n ?? 0),
    completedTransactions: Number(completed?.n ?? 0),
    credibility,
  };
}

export async function getBuyerStats(buyerId: number) {
  const db = await getDb();
  const [pending] = await db
    .select({ n: sql<number>`count(*)` })
    .from(transactions)
    .where(and(eq(transactions.buyerId, buyerId), eq(transactions.transactionStatus, "pending")));
  const [completed] = await db
    .select({ n: sql<number>`count(*)` })
    .from(transactions)
    .where(and(eq(transactions.buyerId, buyerId), eq(transactions.transactionStatus, "completed")));
  return {
    pendingTransactions: Number(pending?.n ?? 0),
    completedTransactions: Number(completed?.n ?? 0),
  };
}

export async function getCategories() {
  const db = await getDb();
  return db.select().from(commodityCategories).orderBy(commodityCategories.categoryName);
}

export async function getUserById(userId: number) {
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return u ?? null;
}
