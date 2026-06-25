// Transaction read queries.

import { alias } from "drizzle-orm/pg-core";
import { desc, eq, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { transactions, produceListings, users, userRatings } from "@/server/db/schema";

export async function listTransactionsForUser(userId: number) {
  const db = await getDb();
  const buyer = alias(users, "buyer");
  const farmer = alias(users, "farmer");
  return db
    .select({
      id: transactions.id,
      status: transactions.transactionStatus,
      totalValue: transactions.totalValue,
      quantity: transactions.quantityAgreedKg,
      createdAt: transactions.createdAt,
      commodityName: produceListings.commodityName,
      buyerId: transactions.buyerId,
      farmerId: transactions.farmerId,
      buyerName: buyer.fullName,
      farmerName: farmer.fullName,
    })
    .from(transactions)
    .leftJoin(produceListings, eq(transactions.listingId, produceListings.id))
    .leftJoin(buyer, eq(transactions.buyerId, buyer.id))
    .leftJoin(farmer, eq(transactions.farmerId, farmer.id))
    .where(or(eq(transactions.buyerId, userId), eq(transactions.farmerId, userId)))
    .orderBy(desc(transactions.createdAt));
}

export async function getTransactionDetail(transactionId: number) {
  const db = await getDb();
  const buyer = alias(users, "buyer");
  const farmer = alias(users, "farmer");
  const [row] = await db
    .select({
      txn: transactions,
      commodityName: produceListings.commodityName,
      buyerName: buyer.fullName,
      farmerName: farmer.fullName,
    })
    .from(transactions)
    .leftJoin(produceListings, eq(transactions.listingId, produceListings.id))
    .leftJoin(buyer, eq(transactions.buyerId, buyer.id))
    .leftJoin(farmer, eq(transactions.farmerId, farmer.id))
    .where(eq(transactions.id, transactionId))
    .limit(1);
  if (!row) return null;

  const [rating] = await db
    .select()
    .from(userRatings)
    .where(eq(userRatings.transactionId, transactionId))
    .limit(1);

  return { ...row, rating: rating ?? null };
}
