// Multi-criteria produce search (FR-04).

import { and, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/server/db";
import { produceListings, farmerProfiles, users, commodityCategories } from "@/server/db/schema";

export type SearchFilters = {
  q?: string;
  categoryId?: number;
  minQuantity?: number;
  maxPrice?: number;
  lga?: string;
  page?: number;
};

const PAGE_SIZE = 9;

export async function searchListings(filters: SearchFilters) {
  const db = await getDb();
  const page = Math.max(1, filters.page ?? 1);

  const conds: SQL[] = [eq(produceListings.listingStatus, "active")];
  if (filters.q) conds.push(ilike(produceListings.commodityName, `%${filters.q}%`));
  if (filters.categoryId) conds.push(eq(produceListings.categoryId, filters.categoryId));
  if (filters.minQuantity)
    conds.push(gte(produceListings.quantityAvailableKg, String(filters.minQuantity)));
  if (filters.maxPrice) conds.push(lte(produceListings.askingPricePerKg, String(filters.maxPrice)));
  if (filters.lga) conds.push(eq(farmerProfiles.lga, filters.lga));

  const where = and(...conds);

  const rows = await db
    .select({
      id: produceListings.id,
      commodityName: produceListings.commodityName,
      quantityAvailableKg: produceListings.quantityAvailableKg,
      askingPricePerKg: produceListings.askingPricePerKg,
      imageUrls: produceListings.imageUrls,
      createdAt: produceListings.createdAt,
      category: commodityCategories.categoryName,
      farmerName: users.fullName,
      lga: farmerProfiles.lga,
    })
    .from(produceListings)
    .leftJoin(farmerProfiles, eq(produceListings.farmerId, farmerProfiles.userId))
    .leftJoin(users, eq(produceListings.farmerId, users.id))
    .leftJoin(commodityCategories, eq(produceListings.categoryId, commodityCategories.id))
    .where(where)
    .orderBy(desc(produceListings.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(produceListings)
    .leftJoin(farmerProfiles, eq(produceListings.farmerId, farmerProfiles.userId))
    .where(where);

  return {
    rows,
    total: Number(total),
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(Number(total) / PAGE_SIZE)),
  };
}
