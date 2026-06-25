// Market price data access (FR-05).

import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { marketPrices } from "@/server/db/schema";
import { LAGOS_MARKETS } from "@/server/lib/constants";

export type PriceRow = typeof marketPrices.$inferSelect;

export async function getAllPrices(): Promise<PriceRow[]> {
  const db = await getDb();
  return db.select().from(marketPrices).orderBy(marketPrices.commodityName, marketPrices.recordedDate);
}

export async function getRecentPriceEntries(limit = 15): Promise<PriceRow[]> {
  const db = await getDb();
  return db.select().from(marketPrices).orderBy(desc(marketPrices.recordedDate), desc(marketPrices.id)).limit(limit);
}

export type LatestCell = { low: number; high: number; mid: number; change: number } | null;

export type PriceBoard = {
  commodities: string[];
  markets: string[];
  latest: Record<string, Record<string, LatestCell>>;
  trend: Record<string, Array<Record<string, string | number>>>;
};

/** Shape raw rows into a per-commodity/market board + 30-day trend series. */
export function buildPriceBoard(rows: PriceRow[]): PriceBoard {
  const markets = [...LAGOS_MARKETS];
  const commodities = [...new Set(rows.map((r) => r.commodityName))];

  const latest: PriceBoard["latest"] = {};
  const trend: PriceBoard["trend"] = {};

  for (const commodity of commodities) {
    latest[commodity] = {};
    const byDate = new Map<string, Record<string, string | number>>();

    for (const market of markets) {
      const series = rows
        .filter((r) => r.commodityName === commodity && r.marketName === market)
        .sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));

      // Latest cell + day-on-day change.
      const last = series.at(-1);
      const prev = series.at(-2);
      if (last) {
        const mid = (Number(last.pricePerKgLow) + Number(last.pricePerKgHigh)) / 2;
        const prevMid = prev ? (Number(prev.pricePerKgLow) + Number(prev.pricePerKgHigh)) / 2 : mid;
        latest[commodity][market] = {
          low: Number(last.pricePerKgLow),
          high: Number(last.pricePerKgHigh),
          mid,
          change: mid - prevMid,
        };
      } else {
        latest[commodity][market] = null;
      }

      // Trend points (mid price per day).
      for (const r of series) {
        const mid = (Number(r.pricePerKgLow) + Number(r.pricePerKgHigh)) / 2;
        const point = byDate.get(r.recordedDate) ?? { date: r.recordedDate.slice(5) };
        point[market] = Math.round(mid);
        byDate.set(r.recordedDate, point);
      }
    }

    trend[commodity] = [...byDate.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }

  return { commodities, markets, latest, trend };
}
