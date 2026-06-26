"use server";

import { desc, eq, and, gte } from "drizzle-orm";
import { getDb } from "@/server/db";
import { marketPrices } from "@/server/db/schema";
import { requireRole } from "@/server/auth/session";

export type FormState = { error?: string; success?: string };

// Public: fetch the most recent month's prices for all commodities
export async function getLatestPrices() {
  const db = await getDb();
  // Get the most recent recorded_date in the table
  const [latest] = await db
    .select({ date: marketPrices.recordedDate })
    .from(marketPrices)
    .orderBy(desc(marketPrices.recordedDate))
    .limit(1);

  if (!latest) return { prices: [], recordedDate: null as string | null };

  const prices = await db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.recordedDate, latest.date))
    .orderBy(marketPrices.commodityName, marketPrices.marketName);

  return { prices, recordedDate: latest.date };
}

// Public: fetch price history for a specific commodity (last 12 months)
export async function getPriceHistory(commodityName: string) {
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(marketPrices)
    .where(
      and(
        eq(marketPrices.commodityName, commodityName),
        gte(marketPrices.recordedDate, cutoffStr),
      ),
    )
    .orderBy(marketPrices.recordedDate, marketPrices.marketName);

  return rows;
}

// Public: get list of all distinct commodities that have prices
export async function getPricedCommodities(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ name: marketPrices.commodityName })
    .from(marketPrices)
    .orderBy(marketPrices.commodityName);
  return rows.map((r) => r.name);
}

// Admin: upsert a monthly price entry
export async function upsertMarketPrice(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");

  const rawCommodity = String(formData.get("commodityName") ?? "").trim();
  const commodityName =
    rawCommodity === "__other__"
      ? String(formData.get("commodityNameOther") ?? "").trim()
      : rawCommodity;
  const marketName = String(formData.get("marketName") ?? "").trim();
  const pricePerKgLow = formData.get("pricePerKgLow");
  const pricePerKgHigh = formData.get("pricePerKgHigh");
  const recordedMonth = String(formData.get("recordedMonth") ?? "").trim(); // YYYY-MM
  const dataSource = String(formData.get("dataSource") ?? "").trim();

  if (!commodityName || !marketName || !pricePerKgLow || !pricePerKgHigh || !recordedMonth) {
    return { error: "All fields except data source are required." };
  }

  const low = Number(pricePerKgLow);
  const high = Number(pricePerKgHigh);
  if (isNaN(low) || isNaN(high) || low <= 0 || high <= 0) {
    return { error: "Prices must be positive numbers." };
  }
  if (high < low) {
    return { error: "High price must be ≥ low price." };
  }
  if (!/^\d{4}-\d{2}$/.test(recordedMonth)) {
    return { error: "Month must be in YYYY-MM format." };
  }

  // Use the first day of the selected month as the recorded_date
  const recordedDate = `${recordedMonth}-01`;
  const db = await getDb();

  // Check if an entry already exists for this commodity + market + month
  const [existing] = await db
    .select({ id: marketPrices.id })
    .from(marketPrices)
    .where(
      and(
        eq(marketPrices.commodityName, commodityName),
        eq(marketPrices.marketName, marketName),
        eq(marketPrices.recordedDate, recordedDate),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(marketPrices)
      .set({
        pricePerKgLow: String(low),
        pricePerKgHigh: String(high),
        dataSource: dataSource || null,
      })
      .where(eq(marketPrices.id, existing.id));
    return { success: "Price entry updated successfully." };
  }

  await db.insert(marketPrices).values({
    commodityName,
    marketName,
    pricePerKgLow: String(low),
    pricePerKgHigh: String(high),
    recordedDate,
    dataSource: dataSource || null,
  });

  return { success: "Price entry saved successfully." };
}

// Admin: fetch all price entries (recent first) for the management table
export async function getAllPricesForAdmin() {
  await requireRole("admin");
  const db = await getDb();
  return db
    .select()
    .from(marketPrices)
    .orderBy(desc(marketPrices.recordedDate), marketPrices.commodityName, marketPrices.marketName);
}

export async function deleteMarketPrice(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  await db.delete(marketPrices).where(eq(marketPrices.id, id));
}
